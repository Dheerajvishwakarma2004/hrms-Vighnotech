import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import mongoose from 'mongoose';
import { getBucket } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const sanitizeFilename = (name) => {
  const base = path.basename(name || 'file').replace(/[^\w.\- ]+/g, '_').trim();
  return base.slice(-150) || 'file';
};

/**
 * Stores an uploaded (multer memory) file in GridFS.
 * @returns {Promise<{ fileId, filename, mimetype, size }>} sub-document for the owning model
 */
export const saveFile = (file, metadata = {}) =>
  new Promise((resolve, reject) => {
    const filename = sanitizeFilename(file.originalname);
    const upload = getBucket().openUploadStream(filename, {
      metadata: { ...metadata, mimetype: file.mimetype },
    });
    upload.once('error', reject);
    upload.once('finish', () =>
      resolve({ fileId: upload.id, filename, mimetype: file.mimetype, size: file.size }),
    );
    upload.end(file.buffer);
  });

/** Deletes a GridFS file. Missing files are ignored so cleanup is idempotent. */
export const deleteFile = async (fileId) => {
  if (!fileId) return;
  try {
    await getBucket().delete(new mongoose.Types.ObjectId(String(fileId)));
  } catch (err) {
    if (!/file not found/i.test(err?.message ?? '')) throw err;
  }
};

/** Deletes several GridFS files (falsy ids are skipped). */
export const deleteFiles = (fileIds) => Promise.all(fileIds.filter(Boolean).map(deleteFile));

/**
 * Streams a stored file to the client as an attachment.
 * @param {import('express').Response} res
 * @param {{ fileId, filename, mimetype }} file sub-document (may be undefined -> 404)
 * @param {string} downloadName filename presented to the user
 * @param {string} notFoundMessage message used when the file does not exist
 */
export const streamFile = async (res, file, downloadName, notFoundMessage = 'File not found') => {
  if (!file?.fileId) throw ApiError.notFound(notFoundMessage);

  const bucket = getBucket();
  const [stored] = await bucket.find({ _id: file.fileId }).limit(1).toArray();
  if (!stored) throw ApiError.notFound(notFoundMessage);

  res.attachment(sanitizeFilename(downloadName));
  res.setHeader('Content-Type', file.mimetype);
  res.setHeader('Content-Length', stored.length);

  // `pipeline` destroys both streams on error or client abort, so the GridFS cursor is always
  // released. The response is destroyed too, so a failure can only be logged, not reported.
  try {
    await pipeline(bucket.openDownloadStream(stored._id), res);
  } catch (err) {
    const clientAborted = err?.code === 'ERR_STREAM_PREMATURE_CLOSE';
    if (!clientAborted && !env.isTest) console.error(`[files] Download of ${stored._id} failed`, err);
  }
};

/**
 * Stores an optional uploaded file, runs `persist(storedFile | null)` and keeps GridFS consistent:
 * the new file is removed when `persist` fails, and the replaced file (`previousFileId`) is
 * removed once `persist` succeeds. Returns whatever `persist` returns.
 *
 * @param {Express.Multer.File | undefined} file multer memory file
 * @param {{ kind: string, previousFileId?: import('mongoose').Types.ObjectId }} options
 * @param {(stored: { fileId, filename, mimetype, size } | null) => Promise<T>} persist
 * @returns {Promise<T>}
 * @template T
 */
export const withUploadedFile = async (file, { kind, previousFileId }, persist) => {
  const stored = file ? await saveFile(file, { kind }) : null;

  let result;
  try {
    result = await persist(stored);
  } catch (err) {
    if (stored) await deleteFile(stored.fileId);
    throw err;
  }

  if (stored && previousFileId) {
    // The owner already points at the new file; an orphaned old file must not fail the request.
    await deleteFile(previousFileId).catch((err) => {
      if (!env.isTest) console.error(`[files] Could not delete replaced file ${previousFileId}`, err);
    });
  }
  return result;
};

/** Builds a download name from a person's name, e.g. "Jane Doe" + "_Resume.pdf" -> "Jane_Doe_Resume.pdf". */
export const buildDownloadName = (fullName, suffix) =>
  `${String(fullName).trim().replace(/\s+/g, '_')}${suffix}`;
