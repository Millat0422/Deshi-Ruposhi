import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/helpers.js';
import { verifyToken } from '../utils/token.js';

const readBearerToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

// Requires a valid JWT. Adds `req.user` (without password).
export const protect = asyncHandler(async (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) throw ApiError.unauthorized('Please log in to continue');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again' : 'Invalid session. Please log in again';
    throw ApiError.unauthorized(message);
  }

  const user = await User.findById(payload.id).select('+passwordChangedAt');
  if (!user) throw ApiError.unauthorized('This account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled. Please contact support');
  if (user.changedPasswordAfter(payload.iat)) {
    throw ApiError.unauthorized('Password was changed recently. Please log in again');
  }

  req.user = user;
  next();
});

// Like `protect` but does not fail for guests (used on public routes that behave differently for admins).
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // Ignore invalid tokens on optional routes.
  }
  return next();
});

// Must be used AFTER `protect`.
export const admin = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(ApiError.forbidden('Admin access only'));
  return next();
};
