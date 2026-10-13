import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const DEV_JWT_SECRET = 'hrms-dev-only-secret-change-me';
const DEV_MONGODB_URI = 'mongodb://127.0.0.1:27017/hrms';

/** Secrets that are published in the repository and therefore must never sign production tokens. */
const PUBLIC_SECRETS = new Set([DEV_JWT_SECRET, 'replace-with-a-long-random-secret']);

/** `jsonwebtoken` reads a unitless string as milliseconds ("7200" = 7 s), so units are mandatory. */
const DURATION_REGEX = /^\d+[smhd]$/;

const blankToUndefined = (value) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.preprocess(
    blankToUndefined,
    z.enum(['development', 'production', 'test']).default('development'),
  ),
  PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).default(5000)),
  MONGODB_URI: z.preprocess(
    blankToUndefined,
    z
      .string()
      .regex(/^mongodb(\+srv)?:\/\//, 'must start with mongodb:// or mongodb+srv://')
      .optional(),
  ),
  JWT_SECRET: z.preprocess(blankToUndefined, z.string().min(16).optional()),
  JWT_EXPIRES_IN: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .regex(DURATION_REGEX, 'must be a number followed by s, m, h or d (e.g. "2h")')
      .default('2h'),
  ),
  CLIENT_URL: z.preprocess(blankToUndefined, z.string().default('http://localhost:5173')),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

const raw = parsed.data;

const isProduction = raw.NODE_ENV === 'production';

if (isProduction) {
  if (!raw.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production');
  }
  if (!raw.JWT_SECRET || PUBLIC_SECRETS.has(raw.JWT_SECRET)) {
    throw new Error('JWT_SECRET must be set to a private random value (min 16 characters) in production');
  }
} else if (!raw.JWT_SECRET && raw.NODE_ENV === 'development') {
  console.warn('[env] JWT_SECRET is not set - using an insecure development fallback secret.');
}

export const env = Object.freeze({
  ...raw,
  MONGODB_URI: raw.MONGODB_URI ?? DEV_MONGODB_URI,
  JWT_SECRET: raw.JWT_SECRET ?? DEV_JWT_SECRET,
  CLIENT_URLS: raw.CLIENT_URL.split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean),
  isProduction,
  isDevelopment: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
});
