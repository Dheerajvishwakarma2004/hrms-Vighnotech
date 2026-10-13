import { Candidate } from '../models/Candidate.js';
import {
  assertEmployeeEmailAvailable,
  moveCandidateToEmployee,
} from '../services/candidate.service.js';
import {
  buildDownloadName,
  deleteFile,
  streamFile,
  withUploadedFile,
} from '../services/file.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  buildPaginationMeta,
  buildRange,
  buildSearchFilter,
  buildSort,
  findByIdOrThrow,
  getPagination,
  pickDefined,
} from '../utils/query.js';

const SEARCH_FIELDS = ['fullName', 'email', 'phone', 'position'];
const MOVED_MESSAGE = 'Candidate moved to employees';

const RESUME_FILE_KIND = 'resume';

const movedResponse = (res, employee) =>
  sendSuccess(res, { message: MOVED_MESSAGE, data: { moved: true, employee } });

export const listCandidates = asyncHandler(async (req, res) => {
  const { search, status, department, position, minExperience, maxExperience, sortBy, sortOrder } =
    req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {
    ...buildSearchFilter(search, SEARCH_FIELDS),
    ...pickDefined({ status, department, position }, ['status', 'department', 'position']),
  };
  const experience = buildRange(minExperience, maxExperience);
  if (experience) filter.experience = experience;

  const [candidates, total] = await Promise.all([
    Candidate.find(filter).sort(buildSort(sortBy, sortOrder)).skip(skip).limit(limit).lean(),
    Candidate.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: candidates, meta: buildPaginationMeta({ page, limit, total }) });
});

export const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await findByIdOrThrow(Candidate, req.params.id, { lean: true });
  return sendSuccess(res, { data: candidate });
});

export const createCandidate = asyncHandler(async (req, res) => {
  const candidate = await withUploadedFile(req.file, { kind: RESUME_FILE_KIND }, (resume) =>
    Candidate.create({ ...req.body, resume, createdBy: req.user._id }),
  );
  return sendSuccess(res, { statusCode: 201, message: 'Candidate created', data: candidate });
});

/**
 * Updates any subset of fields and optionally replaces the resume.
 * Setting `status` to `Selected` moves the candidate to employees (same as the status endpoint).
 */
export const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await findByIdOrThrow(Candidate, req.params.id);
  const { role, ...updates } = req.body;
  const isSelecting = updates.status === 'Selected';

  if (isSelecting) {
    await assertEmployeeEmailAvailable(updates.email ?? candidate.email);
  }

  const employee = await withUploadedFile(
    req.file,
    { kind: RESUME_FILE_KIND, previousFileId: candidate.resume?.fileId },
    async (newResume) => {
      candidate.set(updates);
      if (newResume) candidate.resume = newResume;
      if (!isSelecting) {
        await candidate.save();
        return null;
      }
      await candidate.validate();
      return moveCandidateToEmployee(candidate, { role, userId: req.user._id });
    },
  );

  if (employee) return movedResponse(res, employee);
  return sendSuccess(res, { message: 'Candidate updated', data: { moved: false, candidate } });
});

export const updateCandidateStatus = asyncHandler(async (req, res) => {
  const candidate = await findByIdOrThrow(Candidate, req.params.id);
  const { status, role } = req.body;

  if (status === 'Selected') {
    const employee = await moveCandidateToEmployee(candidate, { role, userId: req.user._id });
    return movedResponse(res, employee);
  }

  candidate.status = status;
  await candidate.save();
  return sendSuccess(res, { message: 'Candidate status updated', data: { moved: false, candidate } });
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await findByIdOrThrow(Candidate, req.params.id);
  await candidate.deleteOne();
  await deleteFile(candidate.resume?.fileId);
  return sendSuccess(res, { message: 'Candidate deleted', data: { _id: candidate._id } });
});

export const downloadCandidateResume = asyncHandler(async (req, res) => {
  const candidate = await findByIdOrThrow(Candidate, req.params.id, {
    lean: true,
    select: 'fullName resume',
  });
  await streamFile(
    res,
    candidate.resume,
    buildDownloadName(candidate.fullName, '_Resume.pdf'),
    'Resume not found for this candidate',
  );
});
