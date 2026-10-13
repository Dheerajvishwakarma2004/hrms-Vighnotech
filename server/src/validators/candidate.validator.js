import { z } from 'zod';
import {
  CANDIDATE_STATUSES,
  DEPARTMENTS,
  EMPLOYEE_ROLES,
  PHONE_REGEX,
} from '../config/constants.js';
import {
  emailField,
  enumField,
  listQuery,
  numberField,
  optionalField,
  rangeIsOrdered,
  requiredString,
} from './common.js';

const phoneField = requiredString('Phone').regex(
  PHONE_REGEX,
  'Phone must be 10-15 digits, optionally starting with +',
);

const candidateFields = {
  fullName: requiredString('Full name', { min: 2, max: 50 }),
  email: emailField,
  phone: phoneField,
  position: requiredString('Position', { min: 2, max: 60 }),
  department: enumField(DEPARTMENTS, 'Department'),
  experience: numberField('Experience', { min: 0, max: 50 }),
  status: enumField(CANDIDATE_STATUSES, 'Status'),
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters'),
};

/** A candidate is only moved to employees once it exists, so `Selected` is not allowed on create. */
export const createCandidateSchema = z.object({
  ...candidateFields,
  status: optionalField(
    candidateFields.status.refine((status) => status !== 'Selected', {
      message: 'Create the candidate first, then select them',
    }),
  ),
  notes: candidateFields.notes.optional(),
});

/** Any subset of fields. `role` is only used when the update selects the candidate. */
export const updateCandidateSchema = z
  .object({
    ...candidateFields,
    role: enumField(EMPLOYEE_ROLES, 'Role'),
  })
  .partial();

export const candidateStatusSchema = z.object({
  status: enumField(CANDIDATE_STATUSES, 'Status'),
  role: optionalField(enumField(EMPLOYEE_ROLES, 'Role')),
});

export const listCandidatesQuery = listQuery({
  sortFields: ['createdAt', 'fullName', 'experience', 'status'],
})
  .extend({
    status: optionalField(enumField(CANDIDATE_STATUSES, 'Status')),
    department: optionalField(enumField(DEPARTMENTS, 'Department')),
    position: optionalField(z.string().trim().max(60)),
    minExperience: optionalField(numberField('Minimum experience', { min: 0, max: 50 })),
    maxExperience: optionalField(numberField('Maximum experience', { min: 0, max: 50 })),
  })
  .superRefine(
    rangeIsOrdered('minExperience', 'maxExperience', 'Maximum experience must be >= minimum experience'),
  );
