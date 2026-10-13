import { Leave } from '../models/Leave.js';
import { ApiError } from '../utils/ApiError.js';
import { toDateKey } from '../utils/date.js';

/**
 * Throws 409 when [startDate, endDate] overlaps another non-rejected leave of the same employee.
 * Rejected leaves never block, and a leave that is itself rejected is never checked.
 */
export const assertNoOverlappingLeave = async ({ employee, startDate, endDate, status, excludeId }) => {
  if (status === 'Rejected') return;

  const filter = {
    employee,
    status: { $ne: 'Rejected' },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };
  if (excludeId) filter._id = { $ne: excludeId };

  const overlapping = await Leave.findOne(filter).select('startDate endDate status').lean();
  if (overlapping) {
    const message =
      `Overlaps an existing ${overlapping.status.toLowerCase()} leave ` +
      `(${toDateKey(overlapping.startDate)} to ${toDateKey(overlapping.endDate)})`;
    throw ApiError.conflict(message, [{ field: 'startDate', message }]);
  }
};
