// End-to-end API smoke test. Start the API first (npm run dev), seed the database,
// then run:  npm run test:api
// Optional env: API_URL (default http://localhost:5000/api), ADMIN_EMAIL, ADMIN_PASSWORD
import assert from 'node:assert/strict';
import dotenv from 'dotenv';

dotenv.config();

const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@orixa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

let passed = 0;
const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
};
const step = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}\n    ${error.message}`);
    process.exitCode = 1;
  }
};

const email = `smoke.${Date.now()}@example.com`;
const password = 'Smoke12345';
let userToken;
let adminToken;
let product;
let orderId;
let createdProductId;

console.log(`\nORiXA API smoke test against ${API}\n`);

await step('health check', async () => {
  const res = await call('GET', '/health');
  assert.equal(res.success, true);
});

await step('register rejects weak password', async () => {
  const res = await call('POST', '/auth/register', { body: { name: 'Weak', email, password: 'short' } });
  assert.equal(res.status, 400);
  assert.equal(res.success, false);
});

await step('register user', async () => {
  const res = await call('POST', '/auth/register', { body: { name: 'Smoke Tester', email, password, confirmPassword: password } });
  assert.equal(res.status, 201, res.message);
  assert.ok(res.data.token);
  assert.equal(res.data.user.password, undefined, 'password must never be returned');
  assert.equal(res.data.user.isAdmin, false);
});

await step('login user', async () => {
  const bad = await call('POST', '/auth/login', { body: { email, password: 'Wrong12345' } });
  assert.equal(bad.status, 401);
  const res = await call('POST', '/auth/login', { body: { email, password } });
  assert.equal(res.status, 200, res.message);
  userToken = res.data.token;
});

await step('GET /auth/me requires token', async () => {
  assert.equal((await call('GET', '/auth/me')).status, 401);
  const res = await call('GET', '/auth/me', { token: userToken });
  assert.equal(res.data.user.email, email);
});

await step('NoSQL injection in login is rejected', async () => {
  const res = await call('POST', '/auth/login', { body: { email: { $gt: '' }, password: { $gt: '' } } });
  assert.ok([400, 401].includes(res.status));
});

await step('browse, search, filter and sort products', async () => {
  const all = await call('GET', '/products?limit=4');
  assert.ok(all.data.total >= 12, 'expected seeded products');
  const search = await call('GET', '/products?search=tee&sort=price_asc');
  assert.ok(search.data.products.length > 0);
  const prices = search.data.products.map((p) => p.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  const filtered = await call('GET', '/products?category=t-shirts&minPrice=10&maxPrice=50&size=M');
  assert.ok(filtered.data.products.every((p) => p.price >= 10 && p.price <= 50 && p.sizes.includes('M')));
  product = filtered.data.products.find((p) => p.stock > 5);
});

await step('product details by id and slug', async () => {
  const byId = await call('GET', `/products/${product._id}`);
  assert.equal(byId.data.product.name, product.name);
  const bySlug = await call('GET', `/products/${product.slug}`);
  assert.equal(bySlug.data.product._id, product._id);
});

await step('customer cannot access admin routes', async () => {
  assert.equal((await call('GET', '/users', { token: userToken })).status, 403);
  assert.equal((await call('GET', '/orders', { token: userToken })).status, 403);
  assert.equal((await call('POST', '/products', { token: userToken, body: {} })).status, 403);
  assert.equal((await call('GET', '/admin/stats')).status, 401);
});

await step('wishlist add / list / remove', async () => {
  const added = await call('POST', `/wishlist/${product._id}`, { token: userToken });
  assert.equal(added.data.products.length, 1);
  const removed = await call('DELETE', `/wishlist/${product._id}`, { token: userToken });
  assert.equal(removed.data.products.length, 0);
});

await step('cart sync (size required)', async () => {
  const noSize = await call('PUT', '/cart', { token: userToken, body: { items: [{ product: product._id, quantity: 1 }] } });
  assert.equal(noSize.data.items.length, 0, 'items without a required size are dropped');
  const res = await call('PUT', '/cart', {
    token: userToken,
    body: { items: [{ product: product._id, quantity: 2, size: 'M', color: product.colors[0].name }] },
  });
  assert.equal(res.data.items[0].quantity, 2);
});

await step('quote calculates totals on the server', async () => {
  const res = await call('POST', '/orders/quote', {
    body: { items: [{ product: product._id, quantity: 2, size: 'M' }], couponCode: 'WELCOME10' },
  });
  const subtotal = product.price * 2;
  assert.equal(res.data.subtotal, subtotal);
  assert.equal(res.data.discount, Math.round(subtotal * 10) / 100);
  const bad = await call('POST', '/orders/quote', { body: { items: [{ product: product._id, quantity: 1, size: 'M' }], couponCode: 'NOPE' } });
  assert.equal(bad.status, 400);
});

const shippingAddress = {
  fullName: 'Smoke Tester', phone: '+8801700000000', address: '12 Gulshan Avenue', city: 'Dhaka', state: 'Dhaka', postalCode: '1212', country: 'Bangladesh',
};

await step('order rejects missing size and unavailable payment', async () => {
  const noSize = await call('POST', '/orders', {
    token: userToken, body: { items: [{ product: product._id, quantity: 1 }], shippingAddress, paymentMethod: 'cod' },
  });
  assert.equal(noSize.status, 400);
  const stripe = await call('POST', '/orders', {
    token: userToken, body: { items: [{ product: product._id, quantity: 1, size: 'M' }], shippingAddress, paymentMethod: 'stripe' },
  });
  assert.equal(stripe.status, 400);
});

await step('checkout creates a COD order and reduces stock', async () => {
  const before = (await call('GET', `/products/${product._id}`)).data.product.stock;
  const res = await call('POST', '/orders', {
    token: userToken,
    body: { items: [{ product: product._id, quantity: 2, size: 'M', price: 0.01 }], shippingAddress, paymentMethod: 'cod', saveAddress: true },
  });
  assert.equal(res.status, 201, res.message);
  assert.equal(res.data.order.items[0].price, product.price, 'client price must be ignored');
  assert.equal(res.data.order.paymentStatus, 'pending');
  assert.match(res.data.order.orderNumber, /^ORX-/);
  orderId = res.data.order._id;
  const after = (await call('GET', `/products/${product._id}`)).data.product.stock;
  assert.equal(after, before - 2);
  const cart = await call('GET', '/cart', { token: userToken });
  assert.equal(cart.data.items.length, 0, 'cart cleared after order');
});

await step('order history + details', async () => {
  const mine = await call('GET', '/orders/my', { token: userToken });
  assert.ok(mine.data.orders.some((o) => o._id === orderId));
  const one = await call('GET', `/orders/${orderId}`, { token: userToken });
  assert.equal(one.data.order._id, orderId);
});

if (!ADMIN_PASSWORD) {
  console.log('\n  (skipping admin tests: set ADMIN_PASSWORD in server/.env)');
} else {
  await step('admin login + dashboard stats', async () => {
    const res = await call('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    assert.equal(res.status, 200, res.message);
    assert.equal(res.data.user.isAdmin, true);
    adminToken = res.data.token;
    const stats = await call('GET', '/admin/stats', { token: adminToken });
    assert.ok(stats.data.totals.orders >= 1);
  });

  await step('admin creates, edits and deletes a product', async () => {
    const categories = await call('GET', '/categories');
    const invalid = await call('POST', '/products', {
      token: adminToken, body: { name: 'Bad', description: 'x', category: categories.data.categories[0]._id, price: -5, stock: -1, sku: 'BAD-1', images: ['https://example.com/a.jpg'] },
    });
    assert.equal(invalid.status, 400, 'negative price/stock must be rejected');

    const created = await call('POST', '/products', {
      token: adminToken,
      body: {
        name: 'Smoke Test Tee', description: 'Created by the smoke test.', category: categories.data.categories[0]._id,
        price: 20, originalPrice: 25, stock: 10, sku: `SMK-${Date.now()}`, images: ['https://example.com/tee.jpg'], sizes: ['M'], colors: [{ name: 'Black', hex: '#000000' }],
      },
    });
    assert.equal(created.status, 201, created.message);
    assert.equal(created.data.product.discount, 20);
    createdProductId = created.data.product._id;

    const edited = await call('PUT', `/products/${createdProductId}`, { token: adminToken, body: { price: 18, stock: 3 } });
    assert.equal(edited.data.product.price, 18);

    const deleted = await call('DELETE', `/products/${createdProductId}`, { token: adminToken });
    assert.equal(deleted.status, 200);
    assert.equal((await call('GET', `/products/${createdProductId}`)).status, 404);
  });

  await step('admin views orders and moves status through the workflow', async () => {
    const list = await call('GET', `/orders?search=${encodeURIComponent('Smoke')}`, { token: adminToken });
    assert.ok(list.data.orders.length >= 1);
    const skip = await call('PUT', `/orders/${orderId}/status`, { token: adminToken, body: { status: 'Delivered' } });
    assert.equal(skip.status, 400, 'cannot jump from Pending to Delivered');
    for (const status of ['Confirmed', 'Processing', 'Shipped', 'Delivered']) {
       
      const res = await call('PUT', `/orders/${orderId}/status`, { token: adminToken, body: { status } });
      assert.equal(res.data.order.orderStatus, status, res.message);
    }
    const final = await call('GET', `/orders/${orderId}`, { token: adminToken });
    assert.equal(final.data.order.paymentStatus, 'paid', 'COD is paid on delivery');
  });

  await step('admin user management never exposes passwords', async () => {
    const users = await call('GET', `/users?search=${encodeURIComponent(email)}`, { token: adminToken });
    const target = users.data.users[0];
    assert.equal(target.password, undefined);
    const disabled = await call('PUT', `/users/${target._id}`, { token: adminToken, body: { isActive: false } });
    assert.equal(disabled.data.user.isActive, false);
    const blocked = await call('GET', '/auth/me', { token: userToken });
    assert.equal(blocked.status, 403, 'disabled users are locked out');
    await call('PUT', `/users/${target._id}`, { token: adminToken, body: { isActive: true } });
  });
}

console.log(`\n${passed} checks passed${process.exitCode ? ' — some checks FAILED' : ''}\n`);
