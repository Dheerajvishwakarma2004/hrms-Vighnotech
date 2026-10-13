import { z } from 'zod';
import { PASSWORD_REGEX } from '../config/constants.js';
import { emailField, requiredString } from './common.js';

export const registerSchema = z
  .object({
    fullName: requiredString('Full name', { min: 2, max: 50 }),
    email: emailField,
    password: z
      .string({ required_error: 'Password is required', invalid_type_error: 'Password must be text' })
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password must be at most 64 characters')
      .regex(
        PASSWORD_REGEX,
        'Password must include uppercase, lowercase, number and special character',
      ),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(1, 'Please confirm your password'),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }
  });

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: 'Password is required', invalid_type_error: 'Password must be text' })
    .min(1, 'Password is required'),
});
