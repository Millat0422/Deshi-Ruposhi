import { Router } from 'express';
import {
  cancelMyOrder, createOrder, getCheckoutConfig, getMyOrders, getOrder, getOrders, quoteOrder, updateOrderStatus,
} from '../controllers/orderController.js';
import { admin, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderRules, mongoIdParam, orderStatusRules, quoteRules } from '../validators/index.js';

const router = Router();

router.get('/config', getCheckoutConfig);
router.post('/quote', validate(quoteRules), quoteOrder);

router.post('/', protect, validate(createOrderRules), createOrder);
router.get('/my', protect, getMyOrders);
router.get('/', protect, admin, getOrders);
router.get('/:id', protect, validate([mongoIdParam()]), getOrder);
router.put('/:id/status', protect, admin, validate(orderStatusRules), updateOrderStatus);
router.put('/:id/cancel', protect, validate([mongoIdParam()]), cancelMyOrder);

export default router;
