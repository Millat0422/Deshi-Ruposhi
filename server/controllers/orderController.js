import { Cart } from '../models/Cart.js';
import { Order, ORDER_STATUSES, STATUS_TRANSITIONS } from '../models/Order.js';
import { User } from '../models/User.js';
import { getPaymentProvider, listPaymentMethods } from '../services/payment/index.js';
import { calculateTotals, pricingConfig } from '../services/pricingService.js';
import { buildLineItems, generateOrderNumber, releaseStock, reserveStock } from '../services/orderService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, escapeRegex, parsePositiveInt, sendSuccess } from '../utils/helpers.js';

const ADDRESS_KEYS = ['fullName', 'phone', 'address', 'city', 'state', 'postalCode', 'country'];
const pickShipping = (address = {}) => Object.fromEntries(ADDRESS_KEYS.map((key) => [key, String(address[key] || '').trim()]));

// GET /api/orders/config  -> pricing rules + payment methods for the checkout page
export const getCheckoutConfig = asyncHandler(async (_req, res) => {
  sendSuccess(res, { pricing: pricingConfig(), paymentMethods: listPaymentMethods() });
});

// POST /api/orders/quote  -> server-calculated totals for the current cart
export const quoteOrder = asyncHandler(async (req, res) => {
  const items = await buildLineItems(req.body.items);
  const totals = calculateTotals(items, req.body.couponCode);
  sendSuccess(res, { items, ...totals });
});

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { items: requestedItems, shippingAddress, paymentMethod, couponCode, notes, saveAddress } = req.body;

  const provider = getPaymentProvider(paymentMethod);
  const items = await buildLineItems(requestedItems);
  const totals = calculateTotals(items, couponCode);

  await reserveStock(items);

  let order;
  try {
    const payment = await provider.initiate({ items, totals, user: req.user });
    order = await Order.create({
      user: req.user._id,
      orderNumber: generateOrderNumber(),
      items,
      shippingAddress: pickShipping(shippingAddress),
      paymentMethod: provider.id,
      paymentStatus: payment.paymentStatus,
      orderStatus: 'Pending',
      statusHistory: [{ status: 'Pending', note: 'Order placed', changedBy: req.user._id }],
      notes: notes || '',
      ...totals,
    });
  } catch (error) {
    await releaseStock(items);
    throw error;
  }

  // Clear the saved cart and optionally remember the address.
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  if (saveAddress) {
    const user = await User.findById(req.user._id);
    const address = pickShipping(shippingAddress);
    const duplicate = user.addresses.some((saved) => ADDRESS_KEYS.every((key) => saved[key] === address[key]));
    if (!duplicate && user.addresses.length < 10) {
      user.addresses.push({ ...address, label: 'Shipping', isDefault: user.addresses.length === 0 });
      await user.save();
    }
  }

  sendSuccess(res, { order }, 201, 'Order placed');
});

// GET /api/orders/my
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).select('-statusHistory').lean();
  sendSuccess(res, { orders });
});

// GET /api/orders/:id  (owner or admin)
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = String(order.user?._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw ApiError.notFound('Order not found');

  sendSuccess(res, { order });
});

// GET /api/orders  (admin) ?search=&status=&page=&limit=
export const getOrders = asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 20, 100);
  const filter = {};

  if (req.query.status && ORDER_STATUSES.includes(req.query.status)) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = String(req.query.paymentStatus);

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(String(req.query.search).trim().slice(0, 80)), 'i');
    const users = await User.find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id').lean();
    filter.$or = [{ orderNumber: pattern }, { 'shippingAddress.fullName': pattern }, { user: { $in: users.map((u) => u._id) } }];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .select('-statusHistory')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  sendSuccess(res, { orders, page, total, pages: Math.max(1, Math.ceil(total / limit)) });
});

const applyStatusChange = async (order, nextStatus, userId, note) => {
  const allowed = STATUS_TRANSITIONS[order.orderStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(`Cannot change an order from ${order.orderStatus} to ${nextStatus}`);
  }

  order.orderStatus = nextStatus;
  order.statusHistory.push({ status: nextStatus, note: note || '', changedBy: userId });

  if (nextStatus === 'Delivered') {
    order.deliveredAt = new Date();
    // Cash on delivery is collected when the parcel is handed over.
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
      order.paymentResult = { provider: 'cod', paidAt: new Date() };
    }
  }

  if (nextStatus === 'Cancelled') {
    order.cancelledAt = new Date();
    order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : 'cancelled';
    await releaseStock(order.items);
  }

  await order.save();
  return order;
};

// PUT /api/orders/:id/status  (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  await applyStatusChange(order, req.body.status, req.user._id, req.body.note);
  await order.populate('user', 'name email');
  sendSuccess(res, { order }, 200, `Order marked as ${order.orderStatus}`);
});

// PUT /api/orders/:id/cancel  (customer can cancel before it is processed)
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (!['Pending', 'Confirmed'].includes(order.orderStatus)) {
    throw ApiError.badRequest('This order can no longer be cancelled. Please contact support.');
  }
  await applyStatusChange(order, 'Cancelled', req.user._id, 'Cancelled by customer');
  sendSuccess(res, { order }, 200, 'Order cancelled');
});
