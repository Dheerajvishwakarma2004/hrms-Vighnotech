import { Employee } from '../models/Employee.js';
import { buildEmployeeSummary, deleteEmployeeCascade } from '../services/employee.service.js';
import { buildDownloadName, streamFile } from '../services/file.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  buildPaginationMeta,
  buildSearchFilter,
  buildSort,
  findByIdOrThrow,
  getPagination,
  pickDefined,
} from '../utils/query.js';

const SEARCH_FIELDS = ['fullName', 'email', 'phone', 'position'];
const FILTER_FIELDS = ['department', 'role', 'position', 'status', 'employmentType'];

export const listEmployees = asyncHandler(async (req, res) => {
  const { search, sortBy, sortOrder } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {
    ...buildSearchFilter(search, SEARCH_FIELDS),
    ...pickDefined(req.query, FILTER_FIELDS),
  };

  const [employees, total] = await Promise.all([
    Employee.find(filter).sort(buildSort(sortBy, sortOrder)).skip(skip).limit(limit).lean(),
    Employee.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: employees, meta: buildPaginationMeta({ page, limit, total }) });
});

export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await findByIdOrThrow(Employee, req.params.id, { lean: true });
  return sendSuccess(res, { data: employee });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.create({ ...req.body, createdBy: req.user._id });
  return sendSuccess(res, { statusCode: 201, message: 'Employee created', data: employee });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await findByIdOrThrow(Employee, req.params.id);
  employee.set(req.body);
  await employee.save();
  return sendSuccess(res, { message: 'Employee updated', data: employee });
});

export const assignEmployeeRole = asyncHandler(async (req, res) => {
  const employee = await findByIdOrThrow(Employee, req.params.id);
  employee.role = req.body.role;
  await employee.save();
  return sendSuccess(res, { message: `Role updated to ${employee.role}`, data: employee });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await findByIdOrThrow(Employee, req.params.id);
  const result = await deleteEmployeeCascade(employee);
  return sendSuccess(res, { message: 'Employee deleted', data: { _id: employee._id, ...result } });
});

export const downloadEmployeeResume = asyncHandler(async (req, res) => {
  const employee = await findByIdOrThrow(Employee, req.params.id, { lean: true });
  await streamFile(
    res,
    employee.resume,
    buildDownloadName(employee.fullName, '_Resume.pdf'),
    'Resume not found for this employee',
  );
});

/** Employee profile with attendance (last 30 days) and leave overview. */
export const getEmployeeSummary = asyncHandler(async (req, res) => {
  const employee = await findByIdOrThrow(Employee, req.params.id, { lean: true });
  return sendSuccess(res, { data: await buildEmployeeSummary(employee) });
});
