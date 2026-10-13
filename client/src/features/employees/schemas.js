import { z } from 'zod';
import { dateKeyField, emailField, nameField, optionalText, phoneField } from '@/lib/validation';
import { todayKey } from '@/lib/date';

const requiredChoice = (label) => z.string().min(1, `${label} is required`);

/** Employee add/edit form — mirrors the server's employee validator. */
export const employeeSchema = z.object({
  fullName: nameField('Full name'),
  email: emailField(),
  phone: phoneField(),
  position: z
    .string()
    .trim()
    .min(1, 'Position is required')
    .min(2, 'Position must be at least 2 characters')
    .max(60, 'Position must be at most 60 characters'),
  department: requiredChoice('Department'),
  role: requiredChoice('Role'),
  employmentType: requiredChoice('Employment type'),
  status: requiredChoice('Status'),
  experience: z
    .string()
    .trim()
    .min(1, 'Experience is required')
    .pipe(
      z.coerce
        .number({ invalid_type_error: 'Experience must be a number' })
        .min(0, 'Experience must be at least 0')
        .max(50, 'Experience must be at most 50'),
    ),
  dateOfJoining: dateKeyField('Date of joining'),
  notes: optionalText(500, 'Notes'),
});

export const EMPLOYEE_FORM_FIELDS = Object.keys(employeeSchema.shape);

/**
 * Initial form values: the employee being edited, or sensible defaults for a new one
 * (first API option for employment type / status, today as the joining date).
 */
export function getEmployeeFormDefaults(employee, options) {
  if (employee) {
    return {
      fullName: employee.fullName ?? '',
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      position: employee.position ?? '',
      department: employee.department ?? '',
      role: employee.role ?? '',
      employmentType: employee.employmentType ?? '',
      status: employee.status ?? '',
      experience: String(employee.experience ?? 0),
      dateOfJoining: employee.dateOfJoining ? String(employee.dateOfJoining).slice(0, 10) : todayKey(),
      notes: employee.notes ?? '',
    };
  }

  return {
    fullName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    role: '',
    employmentType: options.employmentTypes[0] ?? '',
    status: options.employeeStatuses[0] ?? '',
    experience: '0',
    dateOfJoining: todayKey(),
    notes: '',
  };
}

export const assignRoleSchema = z.object({ role: requiredChoice('Role') });
