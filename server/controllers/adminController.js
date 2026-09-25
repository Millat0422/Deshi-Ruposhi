import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { asyncHandler, roundMoney, sendSuccess } from '../utils/helpers.js';

const dayKey = (date) => date.toISOString().slice(0, 10);

// GET /api/admin/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 14, 7), 90);
  // Days are counted in UTC so the result is the same on every server.
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const [totalOrders, totalUsers, totalProducts, salesAgg, statusAgg, recentOrders, lowStock, recentForChart] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Order.aggregate([{ $match: { orderStatus: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(6).select('-statusHistory -items').lean(),
    Product.find({ stock: { $lte: 5 } }).select('name sku stock images').sort({ stock: 1 }).limit(6).lean(),
    Order.find({ createdAt: { $gte: since }, orderStatus: { $ne: 'Cancelled' } }).select('total createdAt').lean(),
  ]);

  // Daily revenue series (computed in JS so it works on every MongoDB-compatible server)
  const series = new Map();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(since);
    date.setUTCDate(since.getUTCDate() + i);
    series.set(dayKey(date), { date: dayKey(date), revenue: 0, orders: 0 });
  }
  recentForChart.forEach((order) => {
    const entry = series.get(dayKey(new Date(order.createdAt)));
    if (entry) {
      entry.revenue = roundMoney(entry.revenue + order.total);
      entry.orders += 1;
    }
  });

  sendSuccess(res, {
    totals: {
      sales: roundMoney(salesAgg[0]?.total || 0),
      orders: totalOrders,
      users: totalUsers,
      products: totalProducts,
    },
    ordersByStatus: Object.fromEntries(statusAgg.map((s) => [s._id, s.count])),
    salesByDay: [...series.values()],
    recentOrders,
    lowStock,
  });
});
