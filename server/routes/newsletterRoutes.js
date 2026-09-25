import { Router } from 'express';
import { subscribe } from '../controllers/newsletterController.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { newsletterRules } from '../validators/index.js';

const router = Router();

router.post('/', authLimiter, validate(newsletterRules), subscribe);

export default router;
