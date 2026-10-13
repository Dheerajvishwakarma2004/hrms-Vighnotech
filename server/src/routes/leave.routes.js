import { Router } from 'express';
import { LEAVE_DOCUMENT_FILE_KINDS } from '../config/constants.js';
import {
  createLeave,
  deleteLeave,
  downloadLeaveDocument,
  getLeave,
  getLeaveCalendar,
  listLeaves,
  updateLeave,
  updateLeaveStatus,
} from '../controllers/leave.controller.js';
import { uploadSingle } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.js';
import {
  calendarQuery,
  createLeaveSchema,
  leaveStatusSchema,
  listLeavesQuery,
  updateLeaveSchema,
} from '../validators/leave.validator.js';

const uploadDocument = uploadSingle('document', {
  kinds: LEAVE_DOCUMENT_FILE_KINDS,
  typeError: 'Document must be a PDF, PNG, JPG, DOC or DOCX file',
});

const router = Router();
const withId = validate({ params: idParams });

router
  .route('/')
  .get(validate({ query: listLeavesQuery }), listLeaves)
  .post(uploadDocument, validate({ body: createLeaveSchema }), createLeave);

router.get('/calendar', validate({ query: calendarQuery }), getLeaveCalendar);

router
  .route('/:id')
  .get(withId, getLeave)
  .patch(withId, uploadDocument, validate({ body: updateLeaveSchema }), updateLeave)
  .delete(withId, deleteLeave);

router.patch('/:id/status', validate({ params: idParams, body: leaveStatusSchema }), updateLeaveStatus);
router.get('/:id/document', withId, downloadLeaveDocument);

export default router;
