import { computeDashboardStats } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { todayDate } from '../utils/date.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const data = await computeDashboardStats(req.query.date ?? todayDate());
  return sendSuccess(res, { data });
});
