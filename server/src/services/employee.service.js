import { ATTENDANCE_STATUSES } from '../config/constants.js';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { Leave } from '../models/Leave.js';
import { addDays, fromDateKey, overlappingDays, todayDate } from '../utils/date.js';
import { countsByKey, groupCountStage } from '../utils/query.js';
import { deleteFiles } from './file.service.js';

const SUMMARY_WINDOW_DAYS = 30;
const RECENT_LIMIT = 10;

/**
 * Deletes an employee together with their attendance, leaves and every related GridFS file.
 * @returns {{ attendanceDeleted: number, leavesDeleted: number }}
 */
export const deleteEmployeeCascade = async (employee) => {
  const leaves = await Leave.find({ employee: employee._id }).select('document').lean();

  const [attendanceResult, leaveResult] = await Promise.all([
    Attendance.deleteMany({ employee: employee._id }),
    Leave.deleteMany({ employee: employee._id }),
  ]);
  await Employee.deleteOne({ _id: employee._id });

  await deleteFiles([employee.resume?.fileId, ...leaves.map((leave) => leave.document?.fileId)]);

  return {
    attendanceDeleted: attendanceResult.deletedCount,
    leavesDeleted: leaveResult.deletedCount,
  };
};

/**
 * Employee profile overview: attendance counts for the last 30 days, recent attendance and
 * leaves, and the number of approved leave days in the current year.
 */
export const buildEmployeeSummary = async (employee) => {
  const today = todayDate();
  const windowStart = addDays(today, -(SUMMARY_WINDOW_DAYS - 1));
  const year = today.getUTCFullYear();
  const yearStart = fromDateKey(`${year}-01-01`);
  const yearEnd = fromDateKey(`${year}-12-31`);

  const [statusCounts, recentAttendance, recentLeaves, approvedThisYear] = await Promise.all([
    Attendance.aggregate([
      { $match: { employee: employee._id, date: { $gte: windowStart, $lte: today } } },
      groupCountStage('status'),
    ]),
    Attendance.find({ employee: employee._id }).sort({ date: -1 }).limit(RECENT_LIMIT).lean(),
    Leave.find({ employee: employee._id }).sort({ startDate: -1 }).limit(RECENT_LIMIT).lean(),
    Leave.find({
      employee: employee._id,
      status: 'Approved',
      startDate: { $lte: yearEnd },
      endDate: { $gte: yearStart },
    })
      .select('startDate endDate')
      .lean(),
  ]);

  const approvedDays = approvedThisYear.reduce(
    (total, leave) => total + overlappingDays(leave.startDate, leave.endDate, yearStart, yearEnd),
    0,
  );

  return {
    employee,
    attendance: {
      from: windowStart,
      to: today,
      counts: countsByKey(ATTENDANCE_STATUSES, statusCounts),
      recent: recentAttendance,
    },
    leaves: { recent: recentLeaves, approvedDays },
  };
};
