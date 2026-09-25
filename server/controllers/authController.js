import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { isEmailConfigured, sendEmail } from '../services/emailService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, sendSuccess } from '../utils/helpers.js';
import { createResetToken, hashToken, signToken } from '../utils/token.js';

const authPayload = (user) => ({ user: user.toJSON(), token: signToken(user._id) });

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.exists({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  // Role is NEVER taken from the request body — new accounts are always customers.
  const user = await User.create({ name, email, password, role: 'user' });
  sendSuccess(res, authPayload(user), 201, 'Account created');
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // Same message for "no user" and "wrong password" so emails can't be probed.
  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled. Please contact support');

  sendSuccess(res, authPayload(user), 200, 'Logged in');
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user.toJSON() });
});

// PUT /api/auth/profile   { name?, currentPassword?, newPassword? }
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const { name, currentPassword, newPassword } = req.body;

  if (name) user.name = name;

  let passwordChanged = false;
  if (newPassword) {
    const matches = await user.matchPassword(currentPassword || '');
    if (!matches) throw ApiError.badRequest('Current password is incorrect');
    user.password = newPassword;
    passwordChanged = true;
  }

  await user.save();
  // A new token is returned because changing the password invalidates old tokens.
  const data = passwordChanged ? authPayload(user) : { user: user.toJSON() };
  sendSuccess(res, data, 200, passwordChanged ? 'Password updated' : 'Profile updated');
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  if (env.isProduction && !isEmailConfigured()) {
    throw new ApiError(503, 'Password reset by email is not configured yet. Please contact support.');
  }

  const genericMessage = 'If an account exists for that email, a reset link has been sent.';
  const user = await User.findOne({ email: req.body.email });
  if (!user || !user.isActive) return sendSuccess(res, null, 200, genericMessage);

  const { rawToken, hashedToken } = createResetToken();
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrls[0]}/reset-password/${rawToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your ORiXA password',
      text: `Hi ${user.name},\n\nReset your password using this link (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Hi ${user.name},</p><p>Reset your password using the link below (valid for 30 minutes):</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('[email] Failed to send reset email:', error.message);
    throw new ApiError(502, 'Could not send the reset email. Please try again later.');
  }

  return sendSuccess(res, null, 200, genericMessage);
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hashToken(req.params.token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  sendSuccess(res, authPayload(user), 200, 'Password has been reset');
});

// ---------- Saved addresses ----------
const ADDRESS_FIELDS = ['label', 'fullName', 'phone', 'address', 'city', 'state', 'postalCode', 'country', 'isDefault'];
const pickAddress = (body) => Object.fromEntries(ADDRESS_FIELDS.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));

const applyDefault = (user, addressId) => {
  user.addresses.forEach((address) => {
    address.isDefault = String(address._id) === String(addressId);
  });
};

// POST /api/auth/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= 10) throw ApiError.badRequest('You can save up to 10 addresses');

  user.addresses.push(pickAddress(req.body));
  const created = user.addresses[user.addresses.length - 1];
  if (created.isDefault || user.addresses.length === 1) applyDefault(user, created._id);

  await user.save();
  sendSuccess(res, { addresses: user.addresses }, 201, 'Address saved');
});

// PUT /api/auth/addresses/:addressId
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  Object.assign(address, pickAddress(req.body));
  if (req.body.isDefault) applyDefault(user, address._id);

  await user.save();
  sendSuccess(res, { addresses: user.addresses }, 200, 'Address updated');
});

// DELETE /api/auth/addresses/:addressId
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');

  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;

  await user.save();
  sendSuccess(res, { addresses: user.addresses }, 200, 'Address removed');
});
