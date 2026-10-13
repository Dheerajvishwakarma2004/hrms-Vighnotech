import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

const INVALID_CREDENTIALS = 'Invalid email or password';

const sendSession = (res, user, { statusCode, message }) => {
  const { token, expiresAt } = signToken(user._id);
  return sendSuccess(res, { statusCode, message, data: { user, token, expiresAt } });
};

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (await User.exists({ email })) {
    const message = 'Email is already registered';
    throw ApiError.conflict(message, [{ field: 'email', message }]);
  }

  const user = await User.create({ fullName, email, password });
  return sendSession(res, user, { statusCode: 201, message: 'Account created successfully' });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }

  return sendSession(res, user, { statusCode: 200, message: 'Logged in successfully' });
});

export const getMe = (req, res) =>
  sendSuccess(res, { data: { user: req.user, expiresAt: req.auth.exp * 1000 } });

export const logout = (req, res) => sendSuccess(res, { message: 'Logged out successfully' });
