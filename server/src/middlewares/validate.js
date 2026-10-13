import { ApiError } from '../utils/ApiError.js';

/** Maps zod issues to `{ field, message }`, keeping only the first message per field. */
export const mapZodIssues = (issues) => {
  const seen = new Set();
  return issues.reduce((errors, issue) => {
    const field = issue.path.join('.');
    if (!seen.has(field)) {
      seen.add(field);
      errors.push({ field, message: issue.message });
    }
    return errors;
  }, []);
};

/**
 * Validates (and coerces) `req.params`, `req.query` and `req.body` with zod schemas.
 * Parsed values replace the raw ones so controllers receive clean, typed data.
 *
 * @param {{ params?, query?, body?, file?: { field: string, message: string } }} schemas
 *   `file` marks an uploaded file (multer) as required; its error is reported with the body errors.
 */
export const validate = (schemas) => (req, res, next) => {
  if (schemas.params) {
    const result = schemas.params.safeParse(req.params);
    if (!result.success) {
      const errors = mapZodIssues(result.error.issues);
      return next(ApiError.badRequest(errors[0].message, errors));
    }
  }

  const errors = [];
  ['query', 'body'].forEach((location) => {
    if (!schemas[location]) return;
    const result = schemas[location].safeParse(req[location] ?? {});
    if (result.success) {
      req[location] = result.data;
    } else {
      errors.push(...mapZodIssues(result.error.issues));
    }
  });

  if (schemas.file && !req.file) {
    errors.push({ field: schemas.file.field, message: schemas.file.message });
  }

  if (errors.length) {
    return next(ApiError.badRequest('Validation failed', errors));
  }
  return next();
};
