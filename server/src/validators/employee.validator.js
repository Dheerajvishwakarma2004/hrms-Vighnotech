import { z } from 'zod';
import {
  DEPARTMENTS,
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  PHONE_REGEX,
} from '../config/constants.js';
import {
  dateField,
  emailField,
  enumField,
  listQuery,
  numberField,
  optionalField,
  requiredString,
} from './common.js';

const employeeFields = {
  fullName: requiredString('Full name', { min: 2, max: 50 }),
  email: emailField,
  phone: requiredString('Phone').regex(PHONE_REGEX, 'Phone must be 10-15 digits, optionally starting with +'),
  position: requiredString('Position', { min: 2, max: 60 }),
  department: enumField(DEPARTMENTS, 'Department'),
  role: enumField(EMPLOYEE_ROLES, 'Role'),
  employmentType: enumField(EMPLOYMENT_TYPES, 'Employment type'),
  status: enumField(EMPLOYEE_STATUSES, 'Status'),
  experience: numberField('Experience', { min: 0, max: 50 }),
  dateOfJoining: dateField('Date of joining'),
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters'),
};

export const createEmployeeSchema = z.object({
  ...employeeFields,
  role: optionalField(employeeFields.role),
  employmentType: optionalField(employeeFields.employmentType),
  status: optionalField(employeeFields.status),
  experience: optionalField(employeeFields.experience),
  dateOfJoining: optionalField(employeeFields.dateOfJoining),
  notes: employeeFields.notes.optional(),
});

export const updateEmployeeSchema = z
  .object(employeeFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

export const employeeRoleSchema = z.object({ role: employeeFields.role });

export const listEmployeesQuery = listQuery({
  sortFields: ['createdAt', 'fullName', 'dateOfJoining', 'experience', 'role'],
}).extend({
  department: optionalField(enumField(DEPARTMENTS, 'Department')),
  role: optionalField(enumField(EMPLOYEE_ROLES, 'Role')),
  position: optionalField(z.string().trim().max(60)),
  status: optionalField(enumField(EMPLOYEE_STATUSES, 'Status')),
  employmentType: optionalField(enumField(EMPLOYMENT_TYPES, 'Employment type')),
});
