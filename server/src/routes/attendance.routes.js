import { Router } from 'express';
import {
  deleteAttendance,
  getEmployeeAttendance,
  listAttendance,
  updateAttendance,
  upsertAttendance,
} from '../controllers/attendance.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  employeeAttendanceParams,
  employeeAttendanceQuery,
  listAttendanceQuery,
  updateAttendanceSchema,
  upsertAttendanceSchema,
} from '../validators/attendance.validator.js';
import { idParams } from '../validators/common.js';

const router = Router();

router
  .route('/')
  .get(validate({ query: listAttendanceQuery }), listAttendance)
  .put(validate({ body: upsertAttendanceSchema }), upsertAttendance);

router.get(
  '/employee/:employeeId',
  validate({ params: employeeAttendanceParams, query: employeeAttendanceQuery }),
  getEmployeeAttendance,
);

router
  .route('/:id')
  .patch(validate({ params: idParams, body: updateAttendanceSchema }), updateAttendance)
  .delete(validate({ params: idParams }), deleteAttendance);

export default router;
