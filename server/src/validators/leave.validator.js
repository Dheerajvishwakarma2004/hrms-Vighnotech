import { z } from 'zod';
import { DEPARTMENTS, LEAVE_STATUSES, LEAVE_TYPES } from '../config/constants.js';
import { DAY_MS } from '../utils/date.js';
import {
  dateField,
  enumField,
  listQuery,
  objectId,
  optionalField,
  rangeIsOrdered,
  requiredString,
} from './common.js';

const MAX_CALENDAR_RANGE_DAYS = 400;
const END_BEFORE_START = 'End date cannot be before start date';

const leaveFields = {
  employeeId: objectId('employee id'),
  leaveType: enumField(LEAVE_TYPES, 'Leave type'),
  startDate: dateField('Start date'),
  endDate: dateField('End date'),
  reason: requiredString('Reason', { min: 3, max: 500 }),
  status: enumField(LEAVE_STATUSES, 'Status'),
};

export const createLeaveSchema = z
  .object({ ...leaveFields, status: optionalField(leaveFields.status) })
  .superRefine(rangeIsOrdered('startDate', 'endDate', END_BEFORE_START));

export const updateLeaveSchema = z
  .object(leaveFields)
  .partial()
  .superRefine(rangeIsOrdered('startDate', 'endDate', END_BEFORE_START));

export const leaveStatusSchema = z.object({ status: leaveFields.status });

export const listLeavesQuery = listQuery({
  sortFields: ['createdAt', 'startDate', 'endDate', 'status'],
})
  .extend({
    status: optionalField(enumField(LEAVE_STATUSES, 'Status')),
    leaveType: optionalField(enumField(LEAVE_TYPES, 'Leave type')),
    department: optionalField(enumField(DEPARTMENTS, 'Department')),
    employeeId: optionalField(objectId('employee id')),
    from: optionalField(dateField('From date')),
    to: optionalField(dateField('To date')),
  })
  .superRefine(rangeIsOrdered('from', 'to', 'To date must be on or after from date'));

export const calendarQuery = z
  .object({
    start: dateField('Start date'),
    end: dateField('End date'),
  })
  .superRefine((data, ctx) => {
    if (data.end < data.start) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end'], message: END_BEFORE_START });
    } else if ((data.end - data.start) / DAY_MS > MAX_CALENDAR_RANGE_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: `Calendar range cannot exceed ${MAX_CALENDAR_RANGE_DAYS} days`,
      });
    }
  });
