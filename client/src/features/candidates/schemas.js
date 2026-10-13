import { z } from 'zod';
import { FILE_TYPES } from '@/lib/constants';
import { emailField, fileField, nameField, optionalText, phoneField } from '@/lib/validation';
import { EXPERIENCE_RANGE } from './constants';

const experienceField = z
  .string()
  .trim()
  .min(1, 'Experience is required')
  .refine((value) => Number.isFinite(Number(value)), 'Experience must be a number')
  .transform(Number)
  .pipe(
    z
      .number()
      .min(EXPERIENCE_RANGE.min, `Experience must be at least ${EXPERIENCE_RANGE.min}`)
      .max(EXPERIENCE_RANGE.max, `Experience must be at most ${EXPERIENCE_RANGE.max}`),
  );

const baseFields = {
  fullName: nameField('Full name'),
  email: emailField(),
  phone: phoneField(),
  position: z
    .string()
    .trim()
    .min(1, 'Position is required')
    .min(2, 'Position must be at least 2 characters')
    .max(60, 'Position must be at most 60 characters'),
  department: z.string().min(1, 'Department is required'),
  experience: experienceField,
  notes: optionalText(500, 'Notes'),
};

/** Mirrors the server's candidate rules. The resume and the declaration are only required when creating. */
export function getCandidateSchema({ isEdit }) {
  const resume = fileField({
    ...FILE_TYPES.resume,
    label: 'Resume',
    required: !isEdit,
  });
  if (isEdit) return z.object({ ...baseFields, resume });
  return z.object({
    ...baseFields,
    resume,
    declaration: z.literal(true, {
      errorMap: () => ({
        message: 'Please confirm the candidate details are accurate',
      }),
    }),
  });
}

/** Form values for a new candidate, or the candidate being edited (inputs hold strings). */
export function getCandidateDefaults(candidate) {
  if (!candidate) {
    return {
      fullName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      experience: '',
      notes: '',
      resume: null,
      declaration: false,
    };
  }
  return {
    fullName: candidate.fullName ?? '',
    email: candidate.email ?? '',
    phone: candidate.phone ?? '',
    position: candidate.position ?? '',
    department: candidate.department ?? '',
    experience: String(candidate.experience ?? 0),
    notes: candidate.notes ?? '',
    resume: null,
  };
}

/** Form fields the server may report errors for (maps the error envelope's `errors[]` onto inputs). */
export const CANDIDATE_FORM_FIELDS = [
  'fullName',
  'email',
  'phone',
  'position',
  'department',
  'experience',
  'notes',
  'resume',
];
