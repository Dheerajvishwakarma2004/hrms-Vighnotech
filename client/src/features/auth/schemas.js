import { z } from 'zod';
import { emailField, nameField, passwordField } from '@/lib/validation';

export const loginSchema = z.object({
  email: emailField(),
  password: z.string().min(1, 'Password is required'),
});

const registerFields = z.object({
  fullName: nameField('Full name'),
  email: emailField(),
  password: passwordField(),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
});

/**
 * Checked as a separate branch of the intersection so "Passwords do not match" is reported together with
 * the other field errors (an object-level `.refine` only runs once every field is already valid).
 */
const passwordsMatch = z
  .object({ password: z.string(), confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const registerSchema = z.intersection(registerFields, passwordsMatch);

export const loginDefaults = { email: '', password: '' };
export const registerDefaults = { fullName: '', email: '', password: '', confirmPassword: '' };

/** Seeded demo account (see server seed script) — offered on the login page for reviewers. */
export const DEMO_CREDENTIALS = { email: 'hr@vighnotech.com', password: 'Hr@12345' };
