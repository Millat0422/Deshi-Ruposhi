import { Router } from 'express';
import { addToWishlist, getWishlist, mergeWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParam } from '../validators/index.js';

const router = Router();

router.use(protect);
router.get('/', getWishlist);
router.post('/merge', mergeWishlist);
router.post('/:productId', validate([mongoIdParam('productId')]), addToWishlist);
router.delete('/:productId', validate([mongoIdParam('productId')]), removeFromWishlist);

export default router;
