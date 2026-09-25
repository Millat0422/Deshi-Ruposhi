import { Router } from 'express';
import { clearCart, getCart, mergeCart, replaceCart } from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cartRules } from '../validators/index.js';

const router = Router();

router.use(protect);
router.get('/', getCart);
router.put('/', validate(cartRules), replaceCart);
router.post('/merge', validate(cartRules), mergeCart);
router.delete('/', clearCart);

export default router;
