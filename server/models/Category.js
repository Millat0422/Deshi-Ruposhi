import mongoose from 'mongoose';
import { slugify } from '../utils/helpers.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 60, unique: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    image: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

categorySchema.pre('validate', function setSlug(next) {
  if (this.isModified('name') || !this.slug) this.slug = slugify(this.name);
  next();
});

export const Category = mongoose.model('Category', categorySchema);
