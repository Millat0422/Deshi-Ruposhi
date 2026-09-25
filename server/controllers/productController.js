import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { normalizeImageList } from '../services/imageService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, escapeRegex, isValidObjectId, parsePositiveInt, sendSuccess, slugify, toList } from '../utils/helpers.js';

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
  popular: { sold: -1, rating: -1, _id: -1 },
  rating: { rating: -1, numReviews: -1, _id: -1 },
  name: { name: 1, _id: 1 },
};

const EDITABLE_FIELDS = [
  'name', 'description', 'category', 'gender', 'price', 'originalPrice', 'images', 'sizes', 'colors',
  'stock', 'sku', 'brand', 'featured', 'active', 'rating', 'numReviews',
];

const pickProductFields = (body) => {
  const data = {};
  EDITABLE_FIELDS.forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  if (data.images) data.images = normalizeImageList(data.images);
  if (data.sku) data.sku = String(data.sku).toUpperCase();
  if (data.sizes) data.sizes = [...new Set(data.sizes)];
  return data;
};

const uniqueSlug = async (name, excludeId) => {
  const base = slugify(name) || 'product';
  let slug = base;
  let counter = 2;
   
  while (await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
};

const ensureCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) throw ApiError.badRequest('Selected category does not exist');
  return category;
};

// Translate query-string filters into a MongoDB filter object.
const buildFilter = async (query, isAdminView) => {
  const filter = {};

  // Shoppers only ever see active products. Admins can filter by status.
  if (!isAdminView) filter.active = true;
  else if (query.status === 'active') filter.active = true;
  else if (query.status === 'inactive') filter.active = false;

  const and = [];

  if (query.search) {
    const pattern = new RegExp(escapeRegex(String(query.search).trim().slice(0, 100)), 'i');
    const matchingCategories = await Category.find({ name: pattern }).select('_id').lean();
    and.push({
      $or: [
        { name: pattern },
        { description: pattern },
        { sku: pattern },
        { brand: pattern },
        ...(matchingCategories.length ? [{ category: { $in: matchingCategories.map((c) => c._id) } }] : []),
      ],
    });
  }

  // category can be a slug ("t-shirts"), an id, or a comma separated list of either
  const categoryValues = toList(query.category);
  if (categoryValues.length) {
    const ids = categoryValues.filter(isValidObjectId);
    const slugs = categoryValues.filter((value) => !isValidObjectId(value)).map((value) => slugify(value));
    const categories = await Category.find({ $or: [{ _id: { $in: ids } }, { slug: { $in: slugs } }] }).select('_id').lean();
    filter.category = { $in: categories.map((c) => c._id) };
  }

  if (query.gender) {
    // "men" also shows unisex items, which is what shoppers expect.
    filter.gender = { $in: [String(query.gender), 'unisex'] };
  }

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (query.minPrice && Number.isFinite(minPrice)) filter.price = { ...filter.price, $gte: minPrice };
  if (query.maxPrice && Number.isFinite(maxPrice)) filter.price = { ...filter.price, $lte: maxPrice };

  const sizes = toList(query.size).map((size) => size.toUpperCase());
  if (sizes.length) filter.sizes = { $in: sizes };

  const colors = toList(query.color);
  if (colors.length) {
    filter['colors.name'] = { $in: colors.map((color) => new RegExp(`^${escapeRegex(color)}$`, 'i')) };
  }

  if (query.featured === 'true') filter.featured = true;
  if (query.inStock === 'true') filter.stock = { $gt: 0 };

  const ids = toList(query.ids).filter(isValidObjectId).slice(0, 60);
  if (ids.length) filter._id = { $in: ids };

  if (and.length) filter.$and = and;
  return filter;
};

// GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const isAdminView = req.user?.role === 'admin' && req.query.admin === 'true';
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 12, 60);
  const sort = SORTS[req.query.sort] || SORTS.newest;

  const filter = await buildFilter(req.query, isAdminView);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, {
    products,
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

// GET /api/products/filters  -> values for the shop sidebar
export const getProductFilters = asyncHandler(async (_req, res) => {
  const products = await Product.find({ active: true }).select('price sizes colors').lean();
  const sizes = new Set();
  const colors = new Map();
  let minPrice = Infinity;
  let maxPrice = 0;

  products.forEach((product) => {
    product.sizes.forEach((size) => sizes.add(size));
    product.colors.forEach((color) => colors.set(color.name.toLowerCase(), color));
    minPrice = Math.min(minPrice, product.price);
    maxPrice = Math.max(maxPrice, product.price);
  });

  sendSuccess(res, {
    sizes: [...sizes],
    colors: [...colors.values()],
    minPrice: Number.isFinite(minPrice) ? Math.floor(minPrice) : 0,
    maxPrice: Math.ceil(maxPrice),
  });
});

// GET /api/products/:id   (accepts a MongoDB id OR a slug)
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user?.role === 'admin';
  const filter = isValidObjectId(id) ? { _id: id } : { slug: slugify(id) };
  if (!isAdmin) filter.active = true;

  const product = await Product.findOne(filter).populate('category', 'name slug').lean();
  if (!product) throw ApiError.notFound('Product not found');

  const related = await Product.find({ active: true, category: product.category?._id, _id: { $ne: product._id } })
    .populate('category', 'name slug')
    .sort({ sold: -1 })
    .limit(4)
    .lean();

  sendSuccess(res, { product, related });
});

// POST /api/products  (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const data = pickProductFields(req.body);
  await ensureCategory(data.category);
  data.slug = await uniqueSlug(data.name);

  const product = await Product.create(data);
  await product.populate('category', 'name slug');
  sendSuccess(res, { product }, 201, 'Product created');
});

// PUT /api/products/:id  (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const data = pickProductFields(req.body);
  if (data.category) await ensureCategory(data.category);
  if (data.name && data.name !== product.name) data.slug = await uniqueSlug(data.name, product._id);

  // When price changes without an originalPrice in the request, keep the old "was" price.
  Object.assign(product, data);
  await product.save();
  await product.populate('category', 'name slug');
  sendSuccess(res, { product }, 200, 'Product updated');
});

// DELETE /api/products/:id  (admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  // Past orders keep their own snapshot of name/price/image, so deleting is safe.
  await product.deleteOne();
  sendSuccess(res, { id: req.params.id }, 200, 'Product deleted');
});
