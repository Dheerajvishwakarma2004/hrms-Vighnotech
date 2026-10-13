import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { sendSuccess } from '../utils/apiResponse.js';
import attendanceRoutes from './attendance.routes.js';
import authRoutes from './auth.routes.js';
import candidateRoutes from './candidate.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import employeeRoutes from './employee.routes.js';
import leaveRoutes from './leave.routes.js';
import metaRoutes from './meta.routes.js';

const router = Router();

router.get('/health', (req, res) =>
  sendSuccess(res, { data: { status: 'ok', uptime: Math.round(process.uptime()) } }),
);

router.use('/auth', authRoutes);

router.use('/candidates', protect, candidateRoutes);
router.use('/employees', protect, employeeRoutes);
router.use('/attendance', protect, attendanceRoutes);
router.use('/leaves', protect, leaveRoutes);
router.use('/dashboard', protect, dashboardRoutes);
router.use('/meta', protect, metaRoutes);

export default router;
