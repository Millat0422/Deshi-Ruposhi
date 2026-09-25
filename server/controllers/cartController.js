import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { asyncHandler, sendSuccess } from '../utils/helpers.js';

const MAX_QTY = 99;

// Clean a list of cart items: drop missing/inactive products, clamp quantity to stock,
// merge duplicates, and return items enriched with current product info.
const sanitizeItems = async (rawItems) => {
  const ids = [...new Set(rawItems.map((item) => String(item.product)))];
  const products = await Product.find({ _id: { $in: ids }, active: true })
    .select('name slug price originalPrice discount images stock sizes colors')
    .lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const merged = new Map();
  rawItems.forEach((item) => {
    const product = productMap.get(String(item.product));
    if (!product || product.stock <= 0) return;
    const size = item.size ? String(item.size).toUpperCase() : '';
    if (product.sizes.length > 0 && !product.sizes.includes(size)) return;
    const color = item.color ? String(item.color) : '';
    const key = `${product._id}|${size}|${color}`;
    const quantity = Math.min((merged.get(key)?.quantity || 0) + Number(item.quantity || 1), product.stock, MAX_QTY);
    merged.set(key, { product: product._id, quantity, size, color });
  });

  const items = [...merged.values()];
  const detailed = items.map((item) => ({ ...item, details: productMap.get(String(item.product)) }));
  return { items, detailed };
};

const getOrCreateCart = async (userId) => (await Cart.findOne({ user: userId })) || new Cart({ user: userId, items: [] });

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const { items, detailed } = await sanitizeItems(cart.items);
  if (items.length !== cart.items.length) {
    cart.items = items;
    await cart.save();
  }
  sendSuccess(res, { items: detailed });
});

// PUT /api/cart   { items: [...] }  -> replaces the saved cart
export const replaceCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const { items, detailed } = await sanitizeItems(req.body.items);
  cart.items = items;
  await cart.save();
  sendSuccess(res, { items: detailed });
});

// POST /api/cart/merge  { items: [...] }  -> used right after login to combine guest + saved cart
export const mergeCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const { items, detailed } = await sanitizeItems([...cart.items.map((i) => i.toObject()), ...req.body.items]);
  cart.items = items;
  await cart.save();
  sendSuccess(res, { items: detailed });
});

// DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } }, { upsert: true });
  sendSuccess(res, { items: [] }, 200, 'Cart cleared');
});
