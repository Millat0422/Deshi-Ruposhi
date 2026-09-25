import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, sendSuccess } from '../utils/helpers.js';

const pickFields = ({ name, description, image, active }) =>
  Object.fromEntries(Object.entries({ name, description, image, active }).filter(([, value]) => value !== undefined));

// GET /api/categories   (includes a productCount for each category)
export const getCategories = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin' && req.query.admin === 'true';
  const categories = await Category.find(isAdmin ? {} : { active: true }).sort({ name: 1 }).lean();

  const counts = await Product.aggregate([{ $match: { active: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  sendSuccess(res, {
    categories: categories.map((category) => ({ ...category, productCount: countMap.get(String(category._id)) || 0 })),
  });
});

// POST /api/categories (admin)
export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(pickFields(req.body));
  sendSuccess(res, { category }, 201, 'Category created');
});

// PUT /api/categories/:id (admin)
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  Object.assign(category, pickFields(req.body));
  await category.save();
  sendSuccess(res, { category }, 200, 'Category updated');
});

// DELETE /api/categories/:id (admin)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  const inUse = await Product.countDocuments({ category: category._id });
  if (inUse > 0) {
    throw ApiError.conflict(`This category still has ${inUse} product(s). Move or delete them first.`);
  }
  await category.deleteOne();
  sendSuccess(res, { id: req.params.id }, 200, 'Category deleted');
});
