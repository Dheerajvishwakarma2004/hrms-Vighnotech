import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { validate } from '../middlewares/validate.js';
import { dateQuery } from '../validators/common.js';

const router = Router();

router.get('/stats', validate({ query: dateQuery }), getDashboardStats);

export default router;
