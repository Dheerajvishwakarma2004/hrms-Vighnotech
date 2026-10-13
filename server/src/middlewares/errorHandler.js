import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { MAX_FILE_SIZE } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { mapZodIssues } from './validate.js';

const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB`,
  LIMIT_FILE_COUNT: 'Only one file can be uploaded',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
  LIMIT_PART_COUNT: 'Too many form parts',
  LIMIT_FIELD_COUNT: 'Too many form fields',
  LIMIT_FIELD_KEY: 'Form field name is too long',
  LIMIT_FIELD_VALUE: 'Form field value is too long',
  MISSING_FIELD_NAME: 'Form field name is missing',
};

/** Converts any thrown value into an ApiError with the right status code. */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    return ApiError.badRequest('Validation failed', mapZodIssues(err.issues));
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item instanceof mongoose.Error.CastError ? `Invalid ${item.path}` : item.message,
    }));
    return ApiError.badRequest('Validation failed', errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    const field = err.path === '_id' ? 'id' : err.path;
    const message = field === 'id' ? 'Invalid id' : `Invalid ${field}`;
    return ApiError.badRequest(message, [{ field, message }]);
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? err.keyPattern ?? {})[0] ?? 'field';
    const message = `${capitalize(field)} already exists`;
    return ApiError.conflict(message, [{ field, message }]);
  }

  if (err instanceof multer.MulterError) {
    const message = MULTER_MESSAGES[err.code] ?? err.message;
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return new ApiError(status, message, err.field ? [{ field: err.field, message }] : undefined);
  }

  if (err?.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Session expired, please log in again');
  }

  if (err?.name === 'JsonWebTokenError' || err?.name === 'NotBeforeError') {
    return ApiError.unauthorized('Invalid session token, please log in again');
  }

  // body-parser errors
  if (err?.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON in request body');
  }
  if (err?.type === 'entity.too.large') {
    return new ApiError(413, 'Request body is too large');
  }
  if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500 && err.expose) {
    return new ApiError(err.status, err.message);
  }

  return null;
};

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity (4 args)
export const errorHandler = (err, req, res, next) => {
  const apiError = normalizeError(err);

  if (!apiError) {
    if (!env.isTest) {
      console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    }
    const body = { success: false, message: 'Something went wrong. Please try again later.' };
    if (!env.isProduction) {
      body.error = err?.message;
      body.stack = err?.stack;
    }
    return res.status(500).json(body);
  }

  const body = { success: false, message: apiError.message };
  if (apiError.errors?.length) body.errors = apiError.errors;
  return res.status(apiError.statusCode).json(body);
};
