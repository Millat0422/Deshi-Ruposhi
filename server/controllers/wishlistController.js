import { Product } from '../models/Product.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, isValidObjectId, sendSuccess } from '../utils/helpers.js';

const MAX_ITEMS = 100;

const loadWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'products',
    match: { active: true },
    populate: { path: 'category', select: 'name slug' },
  });
  return wishlist ? wishlist.products.filter(Boolean) : [];
};

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  sendSuccess(res, { products: await loadWishlist(req.user._id) });
});

// POST /api/wishlist/:productId
export const addToWishlist = asyncHandler(async (req, res) => {
  const exists = await Product.exists({ _id: req.params.productId, active: true });
  if (!exists) throw ApiError.notFound('Product not found');

  const current = await Wishlist.findOne({ user: req.user._id }).select('products').lean();
  if (current && current.products.length >= MAX_ITEMS) throw ApiError.badRequest('Your wishlist is full');

  await Wishlist.updateOne({ user: req.user._id }, { $addToSet: { products: req.params.productId } }, { upsert: true });
  sendSuccess(res, { products: await loadWishlist(req.user._id) }, 200, 'Added to wishlist');
});

// DELETE /api/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.productId } });
  sendSuccess(res, { products: await loadWishlist(req.user._id) }, 200, 'Removed from wishlist');
});

// POST /api/wishlist/merge  { productIds: [] }  -> guest wishlist merged after login
export const mergeWishlist = asyncHandler(async (req, res) => {
  const ids = (Array.isArray(req.body.productIds) ? req.body.productIds : []).filter(isValidObjectId).slice(0, MAX_ITEMS);
  if (ids.length) {
    const valid = await Product.find({ _id: { $in: ids }, active: true }).select('_id').lean();
    await Wishlist.updateOne(
      { user: req.user._id },
      { $addToSet: { products: { $each: valid.map((p) => p._id) } } },
      { upsert: true }
    );
  }
  sendSuccess(res, { products: await loadWishlist(req.user._id) });
});
