import { Router } from 'express';
import {
  assignEmployeeRole,
  createEmployee,
  deleteEmployee,
  downloadEmployeeResume,
  getEmployee,
  getEmployeeSummary,
  listEmployees,
  updateEmployee,
} from '../controllers/employee.controller.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.js';
import {
  createEmployeeSchema,
  employeeRoleSchema,
  listEmployeesQuery,
  updateEmployeeSchema,
} from '../validators/employee.validator.js';

const router = Router();
const withId = validate({ params: idParams });

router
  .route('/')
  .get(validate({ query: listEmployeesQuery }), listEmployees)
  .post(validate({ body: createEmployeeSchema }), createEmployee);

router
  .route('/:id')
  .get(withId, getEmployee)
  .patch(validate({ params: idParams, body: updateEmployeeSchema }), updateEmployee)
  .delete(withId, deleteEmployee);

router.patch('/:id/role', validate({ params: idParams, body: employeeRoleSchema }), assignEmployeeRole);
router.get('/:id/resume', withId, downloadEmployeeResume);
router.get('/:id/summary', withId, getEmployeeSummary);

export default router;
