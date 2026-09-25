import mongoose from 'mongoose';
import { roundMoney } from '../utils/helpers.js';

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE SIZE', '28', '30', '32', '34', '36', '38'];
export const GENDER_OPTIONS = ['men', 'women', 'unisex'];

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    hex: { type: String, trim: true, match: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, default: '#000000' },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 3000 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    gender: { type: String, enum: GENDER_OPTIONS, default: 'unisex' },
    // `price` is the selling price. `originalPrice` is the "was" price (optional).
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    originalPrice: { type: Number, min: [0, 'Original price cannot be negative'], default: 0 },
    // Discount percentage, calculated automatically from price & originalPrice.
    discount: { type: Number, min: 0, max: 100, default: 0 },
    // Image URLs (Cloudinary/S3/any CDN later). Never store base64 images here.
    images: {
      type: [{ type: String, trim: true, maxlength: 1000 }],
      validate: [(list) => list.length >= 1 && list.length <= 8, 'Provide between 1 and 8 image URLs'],
    },
    sizes: { type: [{ type: String, enum: SIZE_OPTIONS }], default: [] },
    colors: { type: [colorSchema], default: [] },
    stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 },
    sku: { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true, maxlength: 40 },
    brand: { type: String, trim: true, default: 'ORiXA', maxlength: 60 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    numReviews: { type: Number, min: 0, default: 0 },
    sold: { type: Number, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

// Keep discount consistent with prices whenever a product is saved.
productSchema.pre('validate', function computeDiscount(next) {
  this.price = roundMoney(this.price);
  this.originalPrice = roundMoney(this.originalPrice || 0);
  if (this.originalPrice > this.price && this.originalPrice > 0) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  } else {
    this.originalPrice = 0;
    this.discount = 0;
  }
  next();
});

// Indexes for the most common shop queries.
productSchema.index({ active: 1, category: 1, price: 1 });
productSchema.index({ active: 1, createdAt: -1 });
productSchema.index({ active: 1, featured: 1 });
productSchema.index({ active: 1, sold: -1 });

export const Product = mongoose.model('Product', productSchema);
