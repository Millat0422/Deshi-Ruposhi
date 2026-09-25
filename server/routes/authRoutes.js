import { Router } from 'express';
import {
  addAddress, deleteAddress, forgotPassword, getMe, login, register, resetPassword, updateAddress, updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  addressRules, forgotPasswordRules, loginRules, mongoIdParam, registerRules, resetPasswordRules, updateProfileRules,
} from '../validators/index.js';

const router = Router();

router.post('/register', authLimiter, validate(registerRules), register);
router.post('/login', authLimiter, validate(loginRules), login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordRules), forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordRules), resetPassword);

router.get('/me', protect, getMe);
router.put('/profile', protect, validate(updateProfileRules), updateProfile);

router.post('/addresses', protect, validate(addressRules), addAddress);
router.put('/addresses/:addressId', protect, validate([mongoIdParam('addressId'), ...addressRules]), updateAddress);
router.delete('/addresses/:addressId', protect, validate([mongoIdParam('addressId')]), deleteAddress);

export default router;
