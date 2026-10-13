import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';

const BEARER_PREFIX = 'Bearer ';

/**
 * Requires a valid `Authorization: Bearer <jwt>` header.
 * Sets `req.user` (the HR user) and `req.auth` (decoded token payload).
 * JWT errors propagate to the error handler (expired -> "Session expired, please log in again").
 */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : '';

  if (!token) {
    throw ApiError.unauthorized('Not authenticated, please log in');
  }

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('The user for this session no longer exists');
  }

  req.user = user;
  req.auth = payload;
  next();
});
