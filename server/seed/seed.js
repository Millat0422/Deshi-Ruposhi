// Seeds categories, products and the first admin account.
//   npm run seed           -> wipe catalog + insert fresh data (users/orders are kept)
//   npm run seed -- --reset   -> ALSO delete users, orders, carts and wishlists
//   npm run seed:destroy   -> delete catalog data only
import crypto from 'crypto';
import { connectDB, disconnectDB } from '../config/db.js';
import { Cart, Category, Order, Product, Subscriber, User, Wishlist } from '../models/index.js';
import { slugify } from '../utils/helpers.js';
import { categories, products } from './data.js';

const args = process.argv.slice(2);
const destroyOnly = args.includes('--destroy');
const fullReset = args.includes('--reset');

const ensureAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@orixa.com').toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`[seed] Promoted existing user ${email} to admin`);
    } else {
      console.log(`[seed] Admin already exists: ${email}`);
    }
    return;
  }

  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || `Orx-${crypto.randomBytes(6).toString('hex')}9`;
  await User.create({ name: process.env.ADMIN_NAME || 'ORiXA Admin', email, password, role: 'admin' });

  console.log('\n[seed] ------------------------------------------------------');
  console.log(`[seed] Admin account created: ${email}`);
  console.log(`[seed] Password: ${generated ? password + '   (generated — change it after logging in!)' : '(the ADMIN_PASSWORD from your .env)'}`);
  console.log('[seed] ------------------------------------------------------\n');
};

const run = async () => {
  await connectDB();

  if (fullReset) {
    await Promise.all([User.deleteMany({}), Order.deleteMany({}), Cart.deleteMany({}), Wishlist.deleteMany({}), Subscriber.deleteMany({})]);
    console.log('[seed] Users, orders, carts, wishlists and subscribers removed');
  }

  await Product.deleteMany({});
  await Category.deleteMany({});
  console.log('[seed] Catalog cleared');

  if (destroyOnly) {
    await disconnectDB();
    return;
  }

  const createdCategories = await Category.create(categories);
  const categoryIdByName = new Map(createdCategories.map((c) => [c.name, c._id]));
  console.log(`[seed] ${createdCategories.length} categories inserted`);

  const productDocs = products.map((product, index) => ({
    ...product,
    slug: slugify(product.name),
    category: categoryIdByName.get(product.category),
    // stagger createdAt so "New arrivals" has a meaningful order
    createdAt: new Date(Date.now() - (products.length - index) * 36 * 60 * 60 * 1000),
  }));
  const createdProducts = await Product.create(productDocs);
  console.log(`[seed] ${createdProducts.length} products inserted`);

  await ensureAdmin();
  await disconnectDB();
  console.log('[seed] Done');
};

run().catch(async (error) => {
  console.error('[seed] Failed:', error.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
