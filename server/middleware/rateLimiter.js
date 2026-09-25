import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const message = (text) => ({ success: false, message: text });
const windowMs = env.rateLimit.windowMinutes * 60 * 1000;

// General limit for the whole API. Reads (GET) get a much higher allowance than writes,
// because many shoppers can share one IP (mobile carriers, offices).
export const apiLimiter = rateLimit({
  windowMs,
  limit: (req) => (req.method === 'GET' ? env.rateLimit.maxRequests * 6 : env.rateLimit.maxRequests),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('Too many requests. Please try again in a few minutes.'),
});

// Stricter limit for login / register / password reset (brute-force protection).
export const authLimiter = rateLimit({
  windowMs,
  limit: env.rateLimit.authMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message('Too many attempts. Please wait a few minutes and try again.'),
});
