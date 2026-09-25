import crypto from 'crypto';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { roundMoney } from '../utils/helpers.js';

// Turn [{ product, quantity, size, color }] from the client into trusted line items
// using CURRENT prices and stock from the database (never trust client prices).
export const buildLineItems = async (requestedItems) => {
  const ids = [...new Set(requestedItems.map((item) => String(item.product)))];
  const products = await Product.find({ _id: { $in: ids }, active: true }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  // Merge duplicate lines (same product + size + color).
  const merged = new Map();
  requestedItems.forEach((item) => {
    const key = `${item.product}|${item.size || ''}|${item.color || ''}`;
    const existing = merged.get(key);
    merged.set(key, { ...item, quantity: (existing?.quantity || 0) + Number(item.quantity) });
  });

  // Total quantity per product across sizes/colors, for the stock check.
  const quantityPerProduct = new Map();
  merged.forEach((item) => {
    const id = String(item.product);
    quantityPerProduct.set(id, (quantityPerProduct.get(id) || 0) + item.quantity);
  });

  const lineItems = [];
  merged.forEach((item) => {
    const product = productMap.get(String(item.product));
    if (!product) throw ApiError.badRequest('A product in your cart is no longer available');

    const size = item.size ? String(item.size).toUpperCase() : '';
    if (product.sizes.length > 0 && !product.sizes.includes(size)) {
      throw ApiError.badRequest(`Please choose a valid size for "${product.name}"`);
    }
    const colorName = item.color ? String(item.color) : '';
    if (product.colors.length > 0 && colorName) {
      const found = product.colors.find((c) => c.name.toLowerCase() === colorName.toLowerCase());
      if (!found) throw ApiError.badRequest(`"${colorName}" is not available for "${product.name}"`);
    }

    const totalQty = quantityPerProduct.get(String(product._id));
    if (product.stock < totalQty) {
      throw ApiError.badRequest(
        product.stock === 0 ? `"${product.name}" is out of stock` : `Only ${product.stock} of "${product.name}" left in stock`
      );
    }

    lineItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      sku: product.sku,
      price: product.price,
      quantity: item.quantity,
      size,
      color: product.colors.length > 0 ? colorName || product.colors[0].name : '',
      lineTotal: roundMoney(product.price * item.quantity),
    });
  });

  return lineItems;
};

// Decrement stock atomically. If any product runs out mid-way, restore the ones already taken.
export const reserveStock = async (lineItems) => {
  const totals = new Map();
  lineItems.forEach((item) => totals.set(String(item.product), (totals.get(String(item.product)) || 0) + item.quantity));

  const reserved = [];
  for (const [productId, quantity] of totals) {
     
    const result = await Product.updateOne(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity, sold: quantity } }
    );
    if (result.modifiedCount !== 1) {
       
      await releaseStock(reserved);
      throw ApiError.conflict('Some items just went out of stock. Please review your cart.');
    }
    reserved.push({ product: productId, quantity });
  }
};

export const releaseStock = async (items) => {
  await Promise.all(
    items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity, sold: -item.quantity } }))
  );
};

// ORX-250925-8F3K2Q  (date + random, unique index on the model is the final guard)
export const generateOrderNumber = () => {
  const now = new Date();
  const date = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `ORX-${date}-${random}`;
};
