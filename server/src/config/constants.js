export const DEPARTMENTS = Object.freeze([
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Support',
]);

export const EMPLOYEE_ROLES = Object.freeze([
  'Intern',
  'Junior',
  'Senior',
  'Team Lead',
  'Manager',
  'Director',
]);

export const CANDIDATE_STATUSES = Object.freeze(['New', 'Scheduled', 'Ongoing', 'Selected', 'Rejected']);

export const EMPLOYMENT_TYPES = Object.freeze(['Full Time', 'Part Time', 'Contract', 'Internship']);

export const EMPLOYEE_STATUSES = Object.freeze(['Active', 'Inactive']);

export const ATTENDANCE_STATUSES = Object.freeze([
  'Present',
  'Absent',
  'Half Day',
  'Work From Home',
  'On Leave',
]);

export const NOT_MARKED = 'Not Marked';

export const LEAVE_TYPES = Object.freeze([
  'Casual',
  'Sick',
  'Earned',
  'Maternity/Paternity',
  'Unpaid',
  'Other',
]);

export const LEAVE_STATUSES = Object.freeze(['Pending', 'Approved', 'Rejected']);

export const USER_ROLES = Object.freeze(['HR']);

export const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const RESUME_FILE_KINDS = Object.freeze(['pdf']);

export const LEAVE_DOCUMENT_FILE_KINDS = Object.freeze(['pdf', 'png', 'jpeg', 'doc', 'docx']);

/** Fields exposed whenever an employee is embedded in another resource (leaves, attendance rows). */
export const EMPLOYEE_SUMMARY_FIELDS = 'fullName email position department role';

export const PAGINATION = Object.freeze({ DEFAULT_LIMIT: 10, MAX_LIMIT: 100 });
