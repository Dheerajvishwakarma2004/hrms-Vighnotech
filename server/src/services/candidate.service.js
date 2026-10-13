import { Candidate } from '../models/Candidate.js';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/ApiError.js';
import { todayDate } from '../utils/date.js';

const DEFAULT_ROLE = 'Junior';

/** Throws 409 when an employee with this email already exists. */
export const assertEmployeeEmailAvailable = async (email) => {
  if (await Employee.exists({ email })) {
    const message = 'An employee with this email already exists';
    throw ApiError.conflict(message, [{ field: 'email', message }]);
  }
};

/**
 * Moves a selected candidate into the employee list with their details intact.
 * The GridFS resume file is re-owned by the new employee (not copied, not deleted).
 * The candidate is removed afterwards; if that fails the employee is rolled back.
 *
 * @param {import('mongoose').Document} candidate validated candidate document (possibly with unsaved changes)
 * @param {{ role?: string, userId?: import('mongoose').Types.ObjectId }} options
 */
export const moveCandidateToEmployee = async (candidate, { role, userId } = {}) => {
  await assertEmployeeEmailAvailable(candidate.email);

  const employee = await Employee.create({
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    position: candidate.position,
    department: candidate.department,
    experience: candidate.experience,
    resume: candidate.resume?.toObject ? candidate.resume.toObject() : candidate.resume,
    notes: candidate.notes,
    role: role ?? DEFAULT_ROLE,
    fromCandidate: true,
    dateOfJoining: todayDate(),
    createdBy: userId,
  });

  try {
    await Candidate.deleteOne({ _id: candidate._id });
  } catch (err) {
    await Employee.deleteOne({ _id: employee._id });
    throw err;
  }

  return employee;
};
