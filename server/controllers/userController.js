import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, escapeRegex, parsePositiveInt, sendSuccess } from '../utils/helpers.js';

// GET /api/users  (admin) ?search=&role=&page=
export const getUsers = asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 20, 100);
  const filter = {};

  if (req.query.role === 'admin' || req.query.role === 'user') filter.role = req.query.role;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'disabled') filter.isActive = false;
  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(String(req.query.search).trim().slice(0, 80)), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, { users: users.map((u) => u.toJSON()), page, total, pages: Math.max(1, Math.ceil(total / limit)) });
});

// GET /api/users/:id  (admin)
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const [orderCount, spent] = await Promise.all([
    Order.countDocuments({ user: user._id }),
    Order.aggregate([
      { $match: { user: user._id, orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  sendSuccess(res, { user: user.toJSON(), stats: { orderCount, totalSpent: spent[0]?.total || 0 } });
});

// PUT /api/users/:id  (admin)  { role?, isActive?, name? }
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const isSelf = String(user._id) === String(req.user._id);
  if (isSelf && (req.body.role === 'user' || req.body.isActive === false)) {
    throw ApiError.badRequest('You cannot remove your own admin access or disable your own account');
  }

  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
  if (req.body.name !== undefined) user.name = req.body.name;

  await user.save();
  sendSuccess(res, { user: user.toJSON() }, 200, 'User updated');
});

// DELETE /api/users/:id  (admin)
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw ApiError.badRequest('You cannot delete your own account');

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const orderCount = await Order.countDocuments({ user: user._id });
  if (orderCount > 0) {
    throw ApiError.conflict('This user has orders. Disable the account instead of deleting it to keep order history.');
  }

  await Promise.all([user.deleteOne(), Wishlist.deleteOne({ user: user._id }), Cart.deleteOne({ user: user._id })]);
  sendSuccess(res, { id: req.params.id }, 200, 'User deleted');
});
