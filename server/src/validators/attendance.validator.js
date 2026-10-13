import { z } from 'zod';
import {
  ATTENDANCE_STATUSES,
  DEPARTMENTS,
  EMPLOYEE_ROLES,
  NOT_MARKED,
} from '../config/constants.js';
import { fromDateKey, todayKey } from '../utils/date.js';
import {
  dateField,
  dateKey,
  enumField,
  listQuery,
  objectId,
  optionalField,
  rangeIsOrdered,
} from './common.js';

const taskField = z
  .string({ invalid_type_error: 'Task must be text' })
  .trim()
  .max(500, 'Task must be at most 500 characters');

const attendanceDate = dateKey('Date')
  .refine((key) => key <= todayKey(), 'Attendance cannot be marked for a future date')
  .transform(fromDateKey);

export const upsertAttendanceSchema = z.object({
  employeeId: objectId('employee id'),
  date: attendanceDate,
  status: enumField(ATTENDANCE_STATUSES, 'Status'),
  task: taskField.optional(),
});

export const updateAttendanceSchema = z
  .object({
    status: enumField(ATTENDANCE_STATUSES, 'Status').optional(),
    task: taskField.optional(),
  })
  .refine((data) => data.status !== undefined || data.task !== undefined, {
    message: 'Provide a status or task to update',
  });

export const listAttendanceQuery = listQuery({
  sortFields: ['fullName', 'department', 'role', 'position', 'createdAt'],
  defaultSortBy: 'fullName',
  defaultSortOrder: 'asc',
}).extend({
  date: optionalField(dateField('Date')),
  department: optionalField(enumField(DEPARTMENTS, 'Department')),
  role: optionalField(enumField(EMPLOYEE_ROLES, 'Role')),
  position: optionalField(z.string().trim().max(60)),
  status: optionalField(enumField([...ATTENDANCE_STATUSES, NOT_MARKED], 'Status')),
});

export const employeeAttendanceParams = z.object({ employeeId: objectId('employee id') });

export const employeeAttendanceQuery = z
  .object({
    from: optionalField(dateField('From date')),
    to: optionalField(dateField('To date')),
  })
  .superRefine(rangeIsOrdered('from', 'to', 'To date must be on or after from date'));
