import { ATTENDANCE_STATUSES, NOT_MARKED } from '../config/constants.js';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { countsByKey } from '../utils/query.js';

/** Keys of a roster summary: every attendance status plus "Not Marked". */
const SUMMARY_KEYS = [...ATTENDANCE_STATUSES, NOT_MARKED];

/** Only active employees appear on the attendance roster. */
const ACTIVE_EMPLOYEES = { status: 'Active' };

const SUMMARY_STAGE = {
  $group: { _id: { $ifNull: ['$attendance.status', NOT_MARKED] }, count: { $sum: 1 } },
};

const ROW_PROJECTION = {
  $project: {
    _id: 0,
    employee: {
      _id: '$_id',
      fullName: '$fullName',
      email: '$email',
      position: '$position',
      department: '$department',
      role: '$role',
    },
    attendance: 1,
  },
};

/** Joins each active employee matching `employeeFilter` with their attendance on `date` (null when not marked). */
const aggregateRoster = (employeeFilter, date, stages) =>
  Employee.aggregate([
    { $match: { ...employeeFilter, ...ACTIVE_EMPLOYEES } },
    {
      $lookup: {
        from: Attendance.collection.collectionName,
        localField: '_id',
        foreignField: 'employee',
        pipeline: [
          { $match: { date } },
          { $project: { _id: 1, status: 1, task: 1, date: 1, updatedAt: 1 } },
        ],
        as: 'attendance',
      },
    },
    { $set: { attendance: { $ifNull: [{ $arrayElemAt: ['$attendance', 0] }, null] } } },
    ...stages,
  ]);

const statusMatch = (status) => {
  if (status === NOT_MARKED) return { attendance: null };
  if (status) return { 'attendance.status': status };
  return {};
};

/**
 * Daily attendance roster for `date`: one page of `{ employee, attendance | null }` rows,
 * the total matching `status`, and a per-status summary of the whole filtered set
 * (ignoring `status` and pagination).
 *
 * @param {{ date: Date, employeeFilter?: object, status?: string, sort: object, skip: number, limit: number }} options
 * @returns {Promise<{ rows: object[], total: number, summary: Record<string, number> }>}
 */
export const getAttendanceRoster = async ({ date, employeeFilter = {}, status, sort, skip, limit }) => {
  const rowsMatch = { $match: statusMatch(status) };
  const [result] = await aggregateRoster(employeeFilter, date, [
    {
      $facet: {
        summary: [SUMMARY_STAGE],
        rows: [rowsMatch, { $sort: sort }, { $skip: skip }, { $limit: limit }, ROW_PROJECTION],
        total: [rowsMatch, { $count: 'count' }],
      },
    },
  ]);

  return {
    rows: result.rows,
    total: result.total[0]?.count ?? 0,
    summary: countsByKey(SUMMARY_KEYS, result.summary),
  };
};

/** Per-status attendance counts of all active employees on `date` (same numbers as the roster summary). */
export const getAttendanceSummary = async (date) =>
  countsByKey(SUMMARY_KEYS, await aggregateRoster({}, date, [SUMMARY_STAGE]));
