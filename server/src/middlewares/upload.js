import path from 'node:path';
import multer from 'multer';
import { MAX_FILE_SIZE } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

const GENERIC_MIMETYPES = new Set(['application/octet-stream', 'binary/octet-stream']);

/** Supported file kinds: accepted MIME types / extensions, canonical MIME type and magic bytes. */
const FILE_KINDS = {
  pdf: {
    mimetypes: ['application/pdf'],
    extensions: ['.pdf'],
    mimetype: 'application/pdf',
    signatures: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  },
  png: {
    mimetypes: ['image/png'],
    extensions: ['.png'],
    mimetype: 'image/png',
    signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  jpeg: {
    mimetypes: ['image/jpeg', 'image/jpg', 'image/pjpeg'],
    extensions: ['.jpg', '.jpeg'],
    mimetype: 'image/jpeg',
    signatures: [[0xff, 0xd8, 0xff]],
  },
  doc: {
    mimetypes: ['application/msword'],
    extensions: ['.doc'],
    mimetype: 'application/msword',
    signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]], // OLE compound file
  },
  docx: {
    mimetypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    extensions: ['.docx'],
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    signatures: [[0x50, 0x4b, 0x03, 0x04]], // ZIP container
  },
};

/**
 * Resolves the file kind from its MIME type; falls back to the extension only when the
 * browser sent a generic MIME type. Returns `null` when the file is not one of `allowedKinds`.
 */
const resolveKind = (file, allowedKinds) => {
  const mimetype = (file.mimetype ?? '').toLowerCase();
  const extension = path.extname(file.originalname ?? '').toLowerCase();
  return (
    allowedKinds.find((kind) => {
      const spec = FILE_KINDS[kind];
      if (GENERIC_MIMETYPES.has(mimetype)) return spec.extensions.includes(extension);
      return spec.mimetypes.includes(mimetype);
    }) ?? null
  );
};

const hasSignature = (buffer, kind) =>
  FILE_KINDS[kind].signatures.some(
    (signature) =>
      buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte),
  );

const unsupportedType = (field, message) => new ApiError(415, message, [{ field, message }]);

/** Caps on the non-file parts of a multipart body (our forms have ~10 short text fields). */
const MULTIPART_LIMITS = Object.freeze({
  files: 1,
  fields: 20,
  parts: 21,
  fieldNameSize: 100,
  fieldSize: 10 * 1024,
});

/**
 * Busboy reports unparsable bodies (truncated form, missing boundary, bad part headers) as plain
 * Errors; those are client mistakes, so they become 400 instead of falling through to 500.
 */
const toUploadError = (error, field) => {
  if (error instanceof ApiError || error instanceof multer.MulterError) return error;
  const message = 'Malformed multipart request';
  return ApiError.badRequest(message, [{ field, message }]);
};

/**
 * Accepts a single optional file in memory (max 5 MB) for the given form field.
 * Rejects disallowed types (415) and files whose content does not match their declared type (415).
 * On success `req.file.mimetype` is normalised to the canonical MIME type.
 *
 * @param {string} field multipart field name
 * @param {{ kinds: string[], typeError: string }} options
 */
export const uploadSingle = (field, { kinds, typeError }) => {
  const parse = multer({
    storage: multer.memoryStorage(),
    limits: { ...MULTIPART_LIMITS, fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, callback) => {
      if (resolveKind(file, kinds)) {
        callback(null, true);
      } else {
        callback(unsupportedType(field, typeError));
      }
    },
  }).single(field);

  return (req, res, next) => {
    parse(req, res, (error) => {
      if (error) return next(toUploadError(error, field));
      if (!req.file) return next();

      const kind = resolveKind(req.file, kinds);
      if (!hasSignature(req.file.buffer, kind)) {
        return next(unsupportedType(field, `${typeError} (file content does not match its type)`));
      }
      req.file.mimetype = FILE_KINDS[kind].mimetype;
      return next();
    });
  };
};
