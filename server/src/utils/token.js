import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/** Signs a session token. Returns the token and its absolute expiry (ms epoch). */
export const signToken = (userId) => {
  const token = jwt.sign({ sub: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  const { exp } = jwt.decode(token);
  return { token, expiresAt: exp * 1000 };
};

/** Verifies a token; throws JsonWebTokenError / TokenExpiredError on failure. */
export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
