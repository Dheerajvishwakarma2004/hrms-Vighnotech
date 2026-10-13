import { CANDIDATE_STATUSES, EMPLOYEE_SUMMARY_FIELDS, NOT_MARKED } from '../config/constants.js';
import { Candidate } from '../models/Candidate.js';
import { Employee } from '../models/Employee.js';
import { Leave } from '../models/Leave.js';
import { addDays, toDateKey } from '../utils/date.js';
import { countsByKey, groupCountStage } from '../utils/query.js';
import { getAttendanceSummary } from './attendance.service.js';

const RECENT_LIMIT = 5;
const UPCOMING_WINDOW_DAYS = 7;

const sumCounts = (counts) => Object.values(counts).reduce((sum, count) => sum + count, 0);

/**
 * Aggregated HR overview for `date` (UTC midnight): candidate pipeline, headcount,
 * attendance of active employees, leave activity and the latest records.
 */
export const computeDashboardStats = async (date) => {
  const upcomingEnd = addDays(date, UPCOMING_WINDOW_DAYS);

  const [
    candidatesByStatus,
    employeesByDepartment,
    activeEmployees,
    attendanceSummary,
    pendingLeaves,
    approvedOnDate,
    upcomingApproved,
    recentCandidates,
    recentLeaves,
  ] = await Promise.all([
    Candidate.aggregate([groupCountStage('status')]),
    Employee.aggregate([groupCountStage('department'), { $sort: { count: -1, _id: 1 } }]),
    Employee.countDocuments({ status: 'Active' }),
    getAttendanceSummary(date),
    Leave.countDocuments({ status: 'Pending' }),
    Leave.find({ status: 'Approved', startDate: { $lte: date }, endDate: { $gte: date } })
      .populate('employee', EMPLOYEE_SUMMARY_FIELDS)
      .sort({ startDate: 1 })
      .lean(),
    Leave.countDocuments({ status: 'Approved', startDate: { $gt: date, $lte: upcomingEnd } }),
    Candidate.find()
      .select('fullName email position department status experience createdAt')
      .sort({ createdAt: -1 })
      .limit(RECENT_LIMIT)
      .lean(),
    Leave.find()
      .populate('employee', EMPLOYEE_SUMMARY_FIELDS)
      .sort({ createdAt: -1 })
      .limit(RECENT_LIMIT)
      .lean(),
  ]);

  const candidateCounts = countsByKey(CANDIDATE_STATUSES, candidatesByStatus);
  const { [NOT_MARKED]: notMarked, ...attendanceByStatus } = attendanceSummary;

  return {
    candidates: { total: sumCounts(candidateCounts), byStatus: candidateCounts },
    employees: {
      total: employeesByDepartment.reduce((sum, { count }) => sum + count, 0),
      active: activeEmployees,
      byDepartment: employeesByDepartment.map(({ _id, count }) => ({ department: _id, count })),
    },
    attendance: {
      date: toDateKey(date),
      marked: sumCounts(attendanceByStatus),
      notMarked,
      byStatus: attendanceByStatus,
    },
    leaves: { pending: pendingLeaves, approvedOnDate, upcomingApproved },
    recentCandidates,
    recentLeaves,
  };
};
