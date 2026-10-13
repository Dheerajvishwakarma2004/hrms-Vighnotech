import { Router } from 'express';
import { RESUME_FILE_KINDS } from '../config/constants.js';
import {
  createCandidate,
  deleteCandidate,
  downloadCandidateResume,
  getCandidate,
  listCandidates,
  updateCandidate,
  updateCandidateStatus,
} from '../controllers/candidate.controller.js';
import { validate } from '../middlewares/validate.js';
import { uploadSingle } from '../middlewares/upload.js';
import {
  candidateStatusSchema,
  createCandidateSchema,
  listCandidatesQuery,
  updateCandidateSchema,
} from '../validators/candidate.validator.js';
import { idParams } from '../validators/common.js';

const uploadResume = uploadSingle('resume', {
  kinds: RESUME_FILE_KINDS,
  typeError: 'Resume must be a PDF file',
});

const router = Router();
const withId = validate({ params: idParams });

router
  .route('/')
  .get(validate({ query: listCandidatesQuery }), listCandidates)
  .post(
    uploadResume,
    validate({
      body: createCandidateSchema,
      file: { field: 'resume', message: 'Resume (PDF) is required' },
    }),
    createCandidate,
  );

router
  .route('/:id')
  .get(withId, getCandidate)
  .patch(withId, uploadResume, validate({ body: updateCandidateSchema }), updateCandidate)
  .delete(withId, deleteCandidate);

router.patch(
  '/:id/status',
  validate({ params: idParams, body: candidateStatusSchema }),
  updateCandidateStatus,
);
router.get('/:id/resume', withId, downloadCandidateResume);

export default router;
