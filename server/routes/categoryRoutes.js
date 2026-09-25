import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController.js';
import { admin, optionalAuth, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categoryRules, mongoIdParam } from '../validators/index.js';

const router = Router();

router.get('/', optionalAuth, getCategories);
router.post('/', protect, admin, validate(categoryRules(false)), createCategory);
router.put('/:id', protect, admin, validate(categoryRules(true)), updateCategory);
router.delete('/:id', protect, admin, validate([mongoIdParam()]), deleteCategory);

export default router;
