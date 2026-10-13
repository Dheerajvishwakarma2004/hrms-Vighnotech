import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';
import { fromDateKey, isValidDateKey } from '../utils/date.js';

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

/** Treats empty / whitespace-only strings as "not provided". */
export const blankToUndefined = (value) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/** Optional field that ignores empty strings (query strings, multipart forms). */
export const optionalField = (schema) => z.preprocess(blankToUndefined, schema.optional());

export const requiredString = (label, { min = 1, max } = {}) => {
  let schema = z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .trim()
    .min(1, `${label} is required`);
  if (min > 1) schema = schema.min(min, `${label} must be at least ${min} characters`);
  if (max) schema = schema.max(max, `${label} must be at most ${max} characters`);
  return schema;
};

/** Number field that accepts numeric strings (multipart / query) and rejects blanks as missing. */
export const numberField = (label, { min, max, int = false } = {}) => {
  let schema = z.number({
    required_error: `${label} is required`,
    invalid_type_error: `${label} must be a number`,
  });
  if (int) schema = schema.int(`${label} must be a whole number`);
  if (min !== undefined) schema = schema.min(min, `${label} must be at least ${min}`);
  if (max !== undefined) schema = schema.max(max, `${label} must be at most ${max}`);
  return z.preprocess((value) => {
    const cleaned = blankToUndefined(value);
    return typeof cleaned === 'string' ? Number(cleaned) : cleaned;
  }, schema);
};

export const enumField = (values, label) =>
  z.enum(values, {
    errorMap: (issue) => ({
      message: issue.code === 'invalid_type' && issue.received === 'undefined'
        ? `${label} is required`
        : `Select a valid ${label.toLowerCase()}`,
    }),
  });

export const emailField = z
  .string({ required_error: 'Email is required', invalid_type_error: 'Email must be text' })
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(100, 'Email must be at most 100 characters')
  .toLowerCase();

export const objectId = (label = 'id') =>
  z
    .string({ required_error: `${label} is required` })
    .regex(OBJECT_ID_REGEX, label === 'id' ? 'Invalid id' : `Invalid ${label}`);

/** `YYYY-MM-DD` string. */
export const dateKey = (label = 'Date') =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .trim()
    .refine(isValidDateKey, `${label} must be a valid date (YYYY-MM-DD)`);

/** `YYYY-MM-DD` string converted to a UTC-midnight Date. */
export const dateField = (label = 'Date') => dateKey(label).transform(fromDateKey);

export const idParams = z.object({ id: objectId() });

/** Optional `?date=YYYY-MM-DD` (defaults are applied by the controller). */
export const dateQuery = z.object({ date: optionalField(dateField('Date')) });

/**
 * Builds the common list query schema (page, limit, search, sortBy, sortOrder).
 * Extra resource-specific filters are merged by the caller via `.extend()`.
 */
export const listQuery = ({ sortFields, defaultSortBy = 'createdAt', defaultSortOrder = 'desc' }) =>
  z.object({
    page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1, 'Page must be at least 1').default(1)),
    limit: z.preprocess(
      blankToUndefined,
      z.coerce
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(PAGINATION.MAX_LIMIT, `Limit must be at most ${PAGINATION.MAX_LIMIT}`)
        .default(PAGINATION.DEFAULT_LIMIT),
    ),
    search: optionalField(z.string().trim().max(100, 'Search must be at most 100 characters')),
    sortBy: z.preprocess(
      blankToUndefined,
      z.enum(sortFields, { errorMap: () => ({ message: `sortBy must be one of: ${sortFields.join(', ')}` }) })
        .default(defaultSortBy),
    ),
    sortOrder: z.preprocess(
      blankToUndefined,
      z.enum(['asc', 'desc'], { errorMap: () => ({ message: 'sortOrder must be asc or desc' }) })
        .default(defaultSortOrder),
    ),
  });

/** Refinement helper: ensures `to >= from` when both are present (works for keys and Dates). */
export const rangeIsOrdered = (fromKey, toKey, message) => (data, ctx) => {
  const from = data[fromKey];
  const to = data[toKey];
  if (from !== undefined && to !== undefined && to < from) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [toKey], message });
  }
};
