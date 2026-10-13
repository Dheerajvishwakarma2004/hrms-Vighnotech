import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { getAttendanceRoster } from '../services/attendance.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toDateKey, todayDate } from '../utils/date.js';
import {
  buildPaginationMeta,
  buildRange,
  buildSearchFilter,
  buildSort,
  findByIdOrThrow,
  getPagination,
  pickDefined,
} from '../utils/query.js';

const SEARCH_FIELDS = ['fullName', 'email', 'position'];
const ATTENDANCE_LABEL = 'Attendance record';

/**
 * Daily attendance roster: every active employee (filtered) joined with that day's attendance
 * record (or `null` when not marked yet), plus a per-status summary for the filtered set.
 */
export const listAttendance = asyncHandler(async (req, res) => {
  const { search, status, sortBy, sortOrder } = req.query;
  const date = req.query.date ?? todayDate();
  const { page, limit, skip } = getPagination(req.query);

  const { rows, total, summary } = await getAttendanceRoster({
    date,
    employeeFilter: {
      ...buildSearchFilter(search, SEARCH_FIELDS),
      ...pickDefined(req.query, ['department', 'role', 'position']),
    },
    status,
    sort: buildSort(sortBy, sortOrder),
    skip,
    limit,
  });

  return sendSuccess(res, {
    data: rows,
    meta: { ...buildPaginationMeta({ page, limit, total }), date: toDateKey(date), summary },
  });
});

/** Creates or updates the attendance of an employee for a date (one record per employee per day). */
export const upsertAttendance = asyncHandler(async (req, res) => {
  const { employeeId, date, status, task } = req.body;
  await findByIdOrThrow(Employee, employeeId, { lean: true });

  const update = { status, updatedBy: req.user._id };
  if (task !== undefined) update.task = task;

  const result = await Attendance.findOneAndUpdate(
    { employee: employeeId, date },
    { $set: update },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      includeResultMetadata: true,
    },
  );

  const created = !result.lastErrorObject?.updatedExisting;
  return sendSuccess(res, {
    message: created ? 'Attendance marked' : 'Attendance updated',
    data: result.value,
  });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await findByIdOrThrow(Attendance, req.params.id, { label: ATTENDANCE_LABEL });
  attendance.set(pickDefined(req.body, ['status', 'task']));
  attendance.updatedBy = req.user._id;
  await attendance.save();
  return sendSuccess(res, { message: 'Attendance updated', data: attendance });
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await findByIdOrThrow(Attendance, req.params.id, { label: ATTENDANCE_LABEL });
  await attendance.deleteOne();
  return sendSuccess(res, { message: 'Attendance record deleted', data: { _id: attendance._id } });
});

export const getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { from, to } = req.query;
  await findByIdOrThrow(Employee, employeeId, { lean: true });

  const filter = { employee: employeeId };
  const range = buildRange(from, to);
  if (range) filter.date = range;

  const records = await Attendance.find(filter).sort({ date: -1 }).lean();
  return sendSuccess(res, { data: records });
});
