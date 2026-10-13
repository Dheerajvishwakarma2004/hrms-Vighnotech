import { EMPLOYEE_SUMMARY_FIELDS } from '../config/constants.js';
import { Employee } from '../models/Employee.js';
import { Leave } from '../models/Leave.js';
import { deleteFile, streamFile, withUploadedFile } from '../services/file.service.js';
import { assertNoOverlappingLeave } from '../services/leave.service.js';
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

const EMPLOYEE_SEARCH_FIELDS = ['fullName', 'email', 'position'];
const CALENDAR_LIMIT = 1000;
const LEAVE_FIELDS = ['leaveType', 'startDate', 'endDate', 'reason', 'status'];
const DOCUMENT_FILE_KIND = 'leave-document';

const populateEmployee = (query) => query.populate('employee', EMPLOYEE_SUMMARY_FIELDS);

/** Validates the leave (dates, overlap), attaches a newly uploaded document and saves it populated. */
const persistLeave = async (leave, document = null) => {
  if (document) leave.document = document;
  await leave.validate();
  await assertNoOverlappingLeave({
    employee: leave.employee,
    startDate: leave.startDate,
    endDate: leave.endDate,
    status: leave.status,
    excludeId: leave.isNew ? undefined : leave._id,
  });
  await leave.save();
  return leave.populate('employee', EMPLOYEE_SUMMARY_FIELDS);
};

export const listLeaves = asyncHandler(async (req, res) => {
  const { search, department, employeeId, from, to, sortBy, sortOrder } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = pickDefined(req.query, ['status', 'leaveType']);
  if (employeeId) filter.employee = employeeId;
  if (from) filter.endDate = { $gte: from };
  if (to) filter.startDate = { $lte: to };

  if (search || department) {
    const employeeFilter = {
      ...buildSearchFilter(search, EMPLOYEE_SEARCH_FIELDS),
      ...pickDefined({ department }, ['department']),
    };
    const employeeIds = await Employee.find(employeeFilter).distinct('_id');
    filter.$and = [{ employee: { $in: employeeIds } }];
  }

  const [leaves, total] = await Promise.all([
    populateEmployee(Leave.find(filter))
      .sort(buildSort(sortBy, sortOrder))
      .skip(skip)
      .limit(limit)
      .lean(),
    Leave.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: leaves, meta: buildPaginationMeta({ page, limit, total }) });
});

/** Approved leaves overlapping [start, end] - powers the leave calendar. */
export const getLeaveCalendar = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const leaves = await populateEmployee(
    Leave.find({ status: 'Approved', startDate: { $lte: end }, endDate: { $gte: start } }),
  )
    .sort({ startDate: 1, _id: 1 })
    .limit(CALENDAR_LIMIT)
    .lean();

  return sendSuccess(res, { data: leaves });
});

export const getLeave = asyncHandler(async (req, res) => {
  const leave = await findByIdOrThrow(Leave, req.params.id, {
    lean: true,
    populate: ['employee', EMPLOYEE_SUMMARY_FIELDS],
  });
  return sendSuccess(res, { data: leave });
});

export const createLeave = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  await findByIdOrThrow(Employee, employeeId, { lean: true });

  const leave = new Leave({
    ...pickDefined(req.body, LEAVE_FIELDS),
    employee: employeeId,
    createdBy: req.user._id,
  });

  await withUploadedFile(req.file, { kind: DOCUMENT_FILE_KIND }, (document) =>
    persistLeave(leave, document),
  );
  return sendSuccess(res, { statusCode: 201, message: 'Leave created', data: leave });
});

export const updateLeave = asyncHandler(async (req, res) => {
  const leave = await findByIdOrThrow(Leave, req.params.id);
  const { employeeId } = req.body;

  if (employeeId) {
    await findByIdOrThrow(Employee, employeeId, { lean: true });
    leave.employee = employeeId;
  }
  leave.set(pickDefined(req.body, LEAVE_FIELDS));

  await withUploadedFile(
    req.file,
    { kind: DOCUMENT_FILE_KIND, previousFileId: leave.document?.fileId },
    (document) => persistLeave(leave, document),
  );
  return sendSuccess(res, { message: 'Leave updated', data: leave });
});

export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const leave = await findByIdOrThrow(Leave, req.params.id);
  leave.status = req.body.status;
  await persistLeave(leave);
  return sendSuccess(res, { message: `Leave ${leave.status.toLowerCase()}`, data: leave });
});

export const deleteLeave = asyncHandler(async (req, res) => {
  const leave = await findByIdOrThrow(Leave, req.params.id);
  await leave.deleteOne();
  await deleteFile(leave.document?.fileId);
  return sendSuccess(res, { message: 'Leave deleted', data: { _id: leave._id } });
});

export const downloadLeaveDocument = asyncHandler(async (req, res) => {
  const leave = await findByIdOrThrow(Leave, req.params.id, { lean: true, select: 'document' });
  await streamFile(res, leave.document, leave.document?.filename, 'No document attached to this leave');
});
