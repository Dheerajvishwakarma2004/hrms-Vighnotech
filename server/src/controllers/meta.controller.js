import {
  ATTENDANCE_STATUSES,
  CANDIDATE_STATUSES,
  DEPARTMENTS,
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  LEAVE_STATUSES,
  LEAVE_TYPES,
  NOT_MARKED,
} from '../config/constants.js';
import { Candidate } from '../models/Candidate.js';
import { Employee } from '../models/Employee.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** Dropdown options for the client - enums plus the positions currently in use. */
export const getOptions = asyncHandler(async (req, res) => {
  const [candidatePositions, employeePositions] = await Promise.all([
    Candidate.distinct('position'),
    Employee.distinct('position'),
  ]);

  const positions = [...new Set([...candidatePositions, ...employeePositions])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );

  return sendSuccess(res, {
    data: {
      departments: DEPARTMENTS,
      roles: EMPLOYEE_ROLES,
      candidateStatuses: CANDIDATE_STATUSES,
      employmentTypes: EMPLOYMENT_TYPES,
      employeeStatuses: EMPLOYEE_STATUSES,
      attendanceStatuses: ATTENDANCE_STATUSES,
      attendanceFilterStatuses: [...ATTENDANCE_STATUSES, NOT_MARKED],
      leaveTypes: LEAVE_TYPES,
      leaveStatuses: LEAVE_STATUSES,
      positions,
    },
  });
});
