import { Router } from 'express';
import {
  createProduct, deleteProduct, getProduct, getProductFilters, getProducts, updateProduct,
} from '../controllers/productController.js';
import { admin, optionalAuth, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createProductRules, mongoIdParam, productQueryRules, updateProductRules } from '../validators/index.js';

const router = Router();

router.get('/', optionalAuth, validate(productQueryRules), getProducts);
router.get('/filters', getProductFilters);
router.get('/:id', optionalAuth, getProduct);

router.post('/', protect, admin, validate(createProductRules), createProduct);
router.put('/:id', protect, admin, validate(updateProductRules), updateProduct);
router.delete('/:id', protect, admin, validate([mongoIdParam()]), deleteProduct);

export default router;
