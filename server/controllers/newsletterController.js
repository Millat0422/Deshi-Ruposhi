import { Subscriber } from '../models/Subscriber.js';
import { asyncHandler, sendSuccess } from '../utils/helpers.js';

// POST /api/newsletter  { email }
export const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const existing = await Subscriber.findOne({ email });
  if (existing) return sendSuccess(res, null, 200, 'You are already part of the ORiXA community');
  await Subscriber.create({ email });
  return sendSuccess(res, null, 201, 'Welcome to the ORiXA community');
});
