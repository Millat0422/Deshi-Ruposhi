import { Router } from 'express';
import { deleteUser, getUser, getUsers, updateUser } from '../controllers/userController.js';
import { admin, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminUpdateUserRules, mongoIdParam } from '../validators/index.js';

const router = Router();

// Every /api/users route is admin-only. Customers manage themselves via /api/auth/*.
router.use(protect, admin);
router.get('/', getUsers);
router.get('/:id', validate([mongoIdParam()]), getUser);
router.put('/:id', validate(adminUpdateUserRules), updateUser);
router.delete('/:id', validate([mongoIdParam()]), deleteUser);

export default router;
