import { z } from 'zod';
import { MAX_UPLOAD_SIZE } from './constants';
import { DATE_KEY_REGEX } from './date';
import { formatBytes } from './formData';
import { getPhoneError } from './phone';

/** Shared zod building blocks that mirror the server's validation rules. */

const NAME_REGEX = /^[\p{L}][\p{L}\s.'-]*$/u;
/** Mirrors the server's email length limit. */
const EMAIL_MAX_LENGTH = 100;

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { id: 'lower', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { id: 'number', label: 'One number', test: (value) => /\d/.test(value) },
  { id: 'special', label: 'One special character', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export const nameField = (label = 'Full name') =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .min(2, `${label} must be at least 2 characters`)
    .max(50, `${label} must be at most 50 characters`)
    .regex(NAME_REGEX, `${label} can only contain letters, spaces, dots, apostrophes and hyphens`);

export const emailField = () =>
  z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(EMAIL_MAX_LENGTH, `Email must be at most ${EMAIL_MAX_LENGTH} characters`)
    .email('Enter a valid email address')
    .transform((value) => value.toLowerCase());

/** Phone as one string (`+919876543210`) built by `PhoneInput`; checked per country by `getPhoneError`. */
export const phoneField = () =>
  z.string().superRefine((value, ctx) => {
    const message = getPhoneError(value);
    if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  });

/** Password strength rules: min 8 chars with upper, lower, number and special character. */
export const passwordField = () =>
  z
    .string()
    .min(1, 'Password is required')
    .max(64, 'Password must be at most 64 characters')
    .superRefine((value, ctx) => {
      const failed = PASSWORD_RULES.find((rule) => !rule.test(value));
      if (failed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Password must contain ${failed.label.toLowerCase()}`,
        });
      }
    });

export const dateKeyField = (label = 'Date') =>
  z.string().min(1, `${label} is required`).regex(DATE_KEY_REGEX, `${label} must be a valid date`);

export const optionalText = (max, label = 'This field') =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`).optional().or(z.literal(''));

/**
 * Validates a `File` (or empty value) chosen through FileInput.
 * Spread a `FILE_TYPES` entry from constants for `mimeTypes`/`extensions`/`description`.
 * @param {{ required?: boolean, label?: string, maxSize?: number, mimeTypes?: string[], extensions?: string[], description?: string }} options
 */
export function fileField({
  required = false,
  label = 'File',
  maxSize = MAX_UPLOAD_SIZE,
  mimeTypes = [],
  extensions = [],
  description,
} = {}) {
  return z.any().superRefine((value, ctx) => {
    if (value === undefined || value === null || value === '') {
      if (required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} is required` });
      return;
    }
    if (!(value instanceof File)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Select a valid ${label.toLowerCase()}` });
      return;
    }
    if (value.size > maxSize) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be ${formatBytes(maxSize)} or smaller` });
    }
    const extension = value.name.split('.').pop()?.toLowerCase() ?? '';
    const typeAllowed =
      (mimeTypes.length === 0 && extensions.length === 0) ||
      mimeTypes.includes(value.type) ||
      extensions.includes(extension);
    if (!typeAllowed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} must be a ${description ?? extensions.join(', ').toUpperCase()} file`,
      });
    }
  });
}
