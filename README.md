# ORiXA — Wear Your Story

A complete, production-ready MERN e-commerce store for the ORiXA fashion brand.

- **Frontend:** React 18 + Vite, React Router, Context API, Axios, Lucide icons, hand-written CSS design system
- **Backend:** Node.js + Express REST API, MongoDB + Mongoose, JWT auth, bcrypt
- **Payments:** Cash on Delivery (real, no fake "payment successful"). Stripe / SSLCommerz slots are prepared in `server/services/payment/`.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Folder structure](#folder-structure)
4. [Quick start](#quick-start)
5. [MongoDB setup](#mongodb-setup)
6. [Environment variables](#environment-variables)
7. [Running the backend / frontend](#running-the-backend--frontend)
8. [Seeding the database](#seeding-the-database)
9. [Admin setup](#admin-setup)
10. [API documentation](#api-documentation)
11. [Testing](#testing)
12. [Replacing the hero banner & product images](#replacing-the-hero-banner--product-images)
13. [Production deployment](#production-deployment)
14. [Common errors](#common-errors)
15. [Known limitations / next steps](#known-limitations--next-steps)

---

## Features

**Store**

- Premium homepage: announcement bar, sticky navbar, hero banner, category cards, featured products, new arrivals, promo band, "Why ORiXA", newsletter, footer
- Shop page with real backend search (name, description, SKU, brand, category), category / gender / price / size / color filters, sorting (newest, popular, price ↑, price ↓) and pagination — all kept in the URL so links can be shared
- Live search overlay in the navbar
- Product details: gallery, rating, price / original price / discount, stock status, color and size selectors (size is **required** when the product has sizes), quantity, Add to bag, Buy now, wishlist, related products
- Cart drawer **and** cart page: quantity +/-, remove, clear, free-shipping progress, dynamic subtotal / shipping / tax / total
- Cart persists in `localStorage`; for logged-in users it is also saved in MongoDB and merged with the guest cart on login
- Wishlist: `localStorage` for guests, MongoDB for logged-in users (merged on login), "Move to bag"
- 3-step checkout (shipping → review → payment), saved addresses, coupon codes (`WELCOME10`, `ORIXA20`), **server-calculated totals**
- Cash on Delivery orders with stock reservation; customers can cancel while an order is Pending/Confirmed
- Order history + order details with a status timeline

**Accounts**

- Register / login / logout, JWT sessions, bcrypt-hashed passwords
- Forgot password → emailed reset link (printed to the server console in development)
- Profile: update name, change password, manage up to 10 saved addresses, recent orders, wishlist

**Admin dashboard (`/admin`, admins only)**

- Stats: total sales, orders, customers, products + revenue chart (7/14/30/90 days), orders by status, low stock, recent orders
- Products: search, filter by category / status, create, edit, delete (full validation, no negative prices or stock)
- Orders: search (order number, customer name or email), filter by status / payment, details page, status workflow `Pending → Confirmed → Processing → Shipped → Delivered` (+ cancel before shipping). COD orders are marked **paid** when delivered.
- Users: search, filter by role, make admin / customer, disable / enable, delete (only users without orders)
- Categories: create, edit, delete (blocked while products still use the category)

**Security**

- bcrypt (12 rounds), JWT (7-day default, invalidated after password change), protected + admin middleware
- Helmet security headers & CSP, strict CORS, rate limiting (stricter on auth endpoints), `express-mongo-sanitize`, HPP, request validation with `express-validator`
- Passwords / reset tokens are never returned (`select: false` + JSON transform)
- New accounts can never make themselves admin; admins cannot demote or disable themselves
- Prices are **never** trusted from the client — orders use current prices from the database
- Centralized error handler with consistent `{ success, message }` responses

---

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, Vite 6, React Router 6, Axios, Context API, lucide-react, @fontsource (Cormorant Garamond + Jost) |
| Backend | Node.js ≥ 18.18, Express 4, Mongoose 8, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, express-validator, express-mongo-sanitize, hpp, compression, nodemailer |
| Tooling | nodemon, ESLint 9, Prettier config, concurrently |

---

## Folder structure

```
ORiXA/
├── package.json              # root scripts (dev runs API + web together)
├── README.md
├── client/                   # React (Vite)
│   ├── index.html
│   ├── vite.config.js        # proxies /api -> http://localhost:5000 in development
│   ├── public/               # favicon, product placeholder image
│   └── src/
│       ├── assets/           # orixa-hero.jpg (homepage banner)
│       ├── components/
│       │   ├── admin/        # SalesChart
│       │   ├── common/       # FormField, Modal, Pagination, Price, Rating, Skeleton, States, ...
│       │   ├── home/         # Hero, CategoryCards, ProductSection, PromoBanner, WhyOrixa, Newsletter
│       │   ├── layout/       # AnnouncementBar, Navbar, MobileMenu, SearchOverlay, CartDrawer, Footer
│       │   ├── product/      # ProductCard, ProductGrid, CartLine, OrderSummary, WishlistButton
│       │   └── routing/      # ProtectedRoute, AdminRoute, GuestRoute
│       ├── context/          # Auth, Cart, Wishlist, Toast, UI (drawers)
│       ├── hooks/            # useAsync, useDebounce, useDocumentTitle, useLockBodyScroll
│       ├── layouts/          # MainLayout, AdminLayout
│       ├── pages/            # Home, Shop, ProductDetails, Cart, Checkout, Orders, Profile, auth pages...
│       │   └── admin/        # Dashboard, AdminProducts, AdminProductEdit, AdminOrders, ...
│       ├── services/         # api.js (axios) + one service file per resource
│       ├── styles/           # variables, base, components, layout, pages, admin
│       └── utils/            # format, pricing, storage, constants, validators
└── server/                   # Express API
    ├── app.js                # middleware, security, routes
    ├── server.js             # starts the server
    ├── config/               # env.js (all env vars), db.js, promotions.js (coupons)
    ├── controllers/          # request handlers
    ├── middleware/           # auth (protect/admin), error, validate, rateLimiter
    ├── models/               # User, Product, Category, Order, Wishlist, Cart, Subscriber
    ├── routes/               # one router per resource
    ├── services/             # pricing, orders/stock, email, images, payment providers
    ├── validators/           # express-validator rules
    ├── utils/                # ApiError, helpers, token
    ├── seed/                 # seed.js, data.js, createAdmin.js
    └── tests/                # api.smoke.js (end-to-end API test)
```

---

## Quick start

Requirements: **Node.js 18.18+** (20 or 22 recommended) and a MongoDB database (local or Atlas).

```bash
# 1. Install everything (root + server + client)
cd ORiXA
npm run install:all

# 2. Create the server environment file
cp server/.env.example server/.env          # Windows: copy server\.env.example server\.env
# then open server/.env and set MONGO_URI, JWT_SECRET and ADMIN_PASSWORD

# 3. Generate a JWT secret (paste the output into JWT_SECRET)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Seed categories, 16 products and the admin account
npm run seed

# 5. Start API (http://localhost:5000) + website (http://localhost:5173)
npm run dev
```

Open **http://localhost:5173**.

---

## MongoDB setup

**Option A — MongoDB Atlas (recommended, free tier)**

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. *Database Access* → add a database user (username + password)
3. *Network Access* → allow your IP (or `0.0.0.0/0` for cloud hosting)
4. *Connect → Drivers* → copy the connection string and add the database name `orixa`:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/orixa?retryWrites=true&w=majority
```

**Option B — Local MongoDB**

Install MongoDB Community Server (https://www.mongodb.com/try/download/community), start it, and use:

```
MONGO_URI=mongodb://127.0.0.1:27017/orixa
```

---

## Environment variables

### `server/.env`

| Variable | Required | Example / default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | | `development` | `production` on the live server |
| `PORT` | | `5000` | |
| `MONGO_URI` | ✅ | `mongodb://127.0.0.1:27017/orixa` | |
| `JWT_SECRET` | ✅ | 96 random hex chars | min. 32 chars in production |
| `JWT_EXPIRES_IN` | | `7d` | |
| `CLIENT_URL` | | `http://localhost:5173` | Allowed CORS origin(s), comma separated. Also used in reset-password links |
| `SERVE_CLIENT` | | `false` | `true` = Express also serves `client/dist` (single-server deploy) |
| `CURRENCY` | | `USD` | |
| `FREE_SHIPPING_THRESHOLD` | | `50` | |
| `SHIPPING_FLAT_RATE` | | `10` | |
| `TAX_RATE` | | `0.05` | 5% |
| `RATE_LIMIT_WINDOW_MINUTES` | | `15` | |
| `RATE_LIMIT_MAX` | | `1000` | write requests per IP per window (GETs get 6×) |
| `AUTH_RATE_LIMIT_MAX` | | `30` | failed login/register/reset attempts per IP per window |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `EMAIL_FROM` | for password reset in production | | Any SMTP provider (Gmail app password, Brevo, Mailgun, SES...) |
| `ADMIN_NAME` `ADMIN_EMAIL` `ADMIN_PASSWORD` | used by `npm run seed` | `admin@orixa.com` | If `ADMIN_PASSWORD` is empty, a random one is generated and printed |
| `CLOUDINARY_*`, `STRIPE_SECRET_KEY` | future | | Not used yet |

### `client/.env` (optional)

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | Leave empty in development. In production set it **only** if the API is on another domain, e.g. `https://api.orixa.com/api` |

> Never commit `.env` files — they are already in `.gitignore`.

---

## Running the backend / frontend

```bash
# both together (from the ORiXA folder)
npm run dev

# or separately
cd server && npm run dev      # API with auto-reload on http://localhost:5000
cd client && npm run dev      # website on http://localhost:5173
```

Other useful commands:

```bash
npm run build        # production build of the React app -> client/dist
npm run lint         # ESLint for server + client
npm start            # start the API in production mode (after building)
```

---

## Seeding the database

```bash
npm run seed                          # replace categories + products, create admin (users/orders kept)
npm run seed --prefix server -- --reset   # ALSO delete all users, orders, carts, wishlists
npm run seed:destroy --prefix server  # delete catalog only
```

The seed creates 6 categories and 16 products (the 12 requested + 4 women's pieces), each with price, category, description, stock, sizes, colors and images. One product is intentionally sold out and one is low in stock so those UI states can be seen.

---

## Admin setup

**Option 1 — during seeding:** set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`, then `npm run seed`.

**Option 2 — any time:**

```bash
# create a new admin
npm run create-admin -- owner@orixa.com "StrongPass123" "Store Owner"

# promote an existing customer account
npm run create-admin -- someone@example.com
```

Then log in at `/login` — admins are taken to `/admin`. Admins can also promote other users from **Admin → Users**.

> **Before handing over:** change the admin password (Profile → Password) and remove `ADMIN_PASSWORD` from the production `.env`.

---

## API documentation

Base URL: `http://localhost:5000/api` · Auth header: `Authorization: Bearer <token>`

Every response is either `{ "success": true, "data": ..., "message"?: "..." }` or `{ "success": false, "message": "...", "errors"?: [{ "field", "message" }] }`.

Legend: 🌐 public · 🔒 logged in · 🛡️ admin

### Auth

| Method | Endpoint | Access | Body / notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | 🌐 | `{ name, email, password, confirmPassword }` → `{ user, token }` |
| POST | `/auth/login` | 🌐 | `{ email, password }` → `{ user, token }` |
| GET | `/auth/me` | 🔒 | current user |
| PUT | `/auth/profile` | 🔒 | `{ name?, currentPassword?, newPassword? }` (returns a new token after a password change) |
| POST | `/auth/forgot-password` | 🌐 | `{ email }` |
| POST | `/auth/reset-password/:token` | 🌐 | `{ password }` |
| POST | `/auth/addresses` | 🔒 | address fields + `label?`, `isDefault?` |
| PUT | `/auth/addresses/:addressId` | 🔒 | |
| DELETE | `/auth/addresses/:addressId` | 🔒 | |

### Products

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/products` | 🌐 | Query: `search, category (slug/id, comma list), gender, minPrice, maxPrice, size, color, featured, inStock, ids, sort (newest\|price_asc\|price_desc\|popular\|rating\|name), page, limit` |
| GET | `/products/filters` | 🌐 | available sizes, colors, price range |
| GET | `/products/:idOrSlug` | 🌐 | `{ product, related }` |
| POST | `/products` | 🛡️ | name, description, category, price, originalPrice?, stock, sku, images[], sizes[], colors[{name,hex}], brand?, gender?, featured?, active? |
| PUT | `/products/:id` | 🛡️ | any of the fields above |
| DELETE | `/products/:id` | 🛡️ | |

Example: `GET /api/products?search=shirt&category=t-shirts&minPrice=10&maxPrice=50&sort=price_asc`

### Categories

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/categories` | 🌐 (includes `productCount`) |
| POST | `/categories` | 🛡️ `{ name, description?, image?, active? }` |
| PUT | `/categories/:id` | 🛡️ |
| DELETE | `/categories/:id` | 🛡️ (fails while products use it) |

### Cart (logged-in users)

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/cart` | 🔒 |
| PUT | `/cart` | 🔒 `{ items: [{ product, quantity, size, color }] }` replaces the cart |
| POST | `/cart/merge` | 🔒 merge a guest cart after login |
| DELETE | `/cart` | 🔒 |

### Orders

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/orders/config` | 🌐 | pricing rules + payment methods |
| POST | `/orders/quote` | 🌐 | `{ items, couponCode? }` → server totals |
| POST | `/orders` | 🔒 | `{ items, shippingAddress, paymentMethod: "cod", couponCode?, notes?, saveAddress? }` |
| GET | `/orders/my` | 🔒 | |
| GET | `/orders/:id` | 🔒 | owner or admin |
| PUT | `/orders/:id/cancel` | 🔒 | owner, while Pending/Confirmed |
| GET | `/orders` | 🛡️ | `search, status, paymentStatus, page, limit` |
| PUT | `/orders/:id/status` | 🛡️ | `{ status, note? }` — only valid transitions are accepted |

### Wishlist

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/wishlist` | 🔒 |
| POST | `/wishlist/:productId` | 🔒 |
| DELETE | `/wishlist/:productId` | 🔒 |
| POST | `/wishlist/merge` | 🔒 `{ productIds: [] }` |

### Users (admin)

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/users` | 🛡️ `search, role, status, page` |
| GET | `/users/:id` | 🛡️ includes order count & total spent |
| PUT | `/users/:id` | 🛡️ `{ role?, isActive?, name? }` |
| DELETE | `/users/:id` | 🛡️ only users without orders |

### Other

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/admin/stats?days=14` | 🛡️ dashboard data |
| POST | `/newsletter` | 🌐 `{ email }` |
| GET | `/health` | 🌐 |

---

## Testing

An end-to-end API test covers registration, login, NoSQL-injection attempts, search/filter/sort, product details, admin-route protection, wishlist, cart sync, server-side totals and coupons, size validation, order creation (client prices are ignored, stock is reserved), order history, admin product CRUD, order status workflow (COD paid on delivery) and user management.

```bash
# with the API running and the database seeded:
npm run test:api
```

During development the full UI was also tested in a real browser (register, login, logout, browse, search, filter, product details, size validation, cart add/increase/decrease/remove, refresh persistence, wishlist, checkout, order history, admin login, product create/edit/delete, admin orders and status changes, unauthorized admin access) at 1440, 1200, 992, 768, 576 and 375 px widths with no horizontal overflow and no console errors.

---

## Replacing the hero banner & product images

**Hero banner:** put the official banner in `client/src/assets/` named `orixa-hero.jpg` (or `.png` / `.webp`) and delete the old one. The first file matching `orixa-hero.*` is used automatically. It is shown full-width at its natural aspect ratio — never cropped or stretched — so the branding text in the image stays visible on every screen size.

> The banner currently in the project is a temporary placeholder created in the brand colours because the original ORiXA image was not included with the request. Replace it before launch.

**Product images:** the seed uses Unsplash CDN URLs so the shop works immediately. Any image that fails to load automatically shows a branded placeholder. To use your own photos, upload them to a CDN (Cloudinary, S3, ImageKit...) and paste the URLs in **Admin → Products → Edit**. Images are stored as URLs — never as base64 in MongoDB. `server/services/imageService.js` is the place to add a Cloudinary upload later.

---

## Production deployment

### Option A — one server (simplest): Render / Railway / a VPS

The Express server can serve the built React app, so the whole site runs as one service.

```bash
npm run install:all
npm run build
cd server && NODE_ENV=production SERVE_CLIENT=true npm start
```

Environment variables on the host:

```
NODE_ENV=production
SERVE_CLIENT=true
MONGO_URI=<your Atlas connection string>
JWT_SECRET=<long random string>
CLIENT_URL=https://your-domain.com
SMTP_HOST=... SMTP_USER=... SMTP_PASS=... EMAIL_FROM=...
```

- **Render:** New → Web Service → connect the repo. Build command: `npm run install:all && npm run build`. Start command: `npm start`. Add the variables above.
- **VPS (Ubuntu):** install Node 20, clone the repo, run the commands above with **PM2** (`npm i -g pm2 && pm2 start server/server.js --name orixa && pm2 save`), then put Nginx in front (`proxy_pass http://127.0.0.1:5000;`) and add HTTPS with Certbot.

### Option B — separate frontend and API

- **API** on Render/Railway: root directory `server`, build `npm install`, start `npm start`, env vars as above with `SERVE_CLIENT=false` and `CLIENT_URL=https://your-frontend-domain.com`.
- **Frontend** on Vercel/Netlify: root directory `client`, build `npm run build`, output `dist`, env `VITE_API_URL=https://your-api-domain.com/api`. Add an SPA rewrite so every route serves `index.html` (Vercel: `vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`; Netlify: `_redirects` → `/* /index.html 200`).

### Launch checklist

- [ ] Replace `client/src/assets/orixa-hero.jpg` with the official banner
- [ ] Replace product photos with real product photography
- [ ] Update contact details (`client/src/pages/Contact.jsx`) and social links (`client/src/components/layout/Footer.jsx`)
- [ ] Review Shipping, Privacy and Terms texts (`client/src/pages/InfoPage.jsx`)
- [ ] Set a strong `JWT_SECRET`, change the admin password, remove `ADMIN_PASSWORD` from `.env`
- [ ] Configure SMTP so password-reset emails are delivered
- [ ] Review coupons in `server/config/promotions.js`, currency, shipping & tax in `.env`
- [ ] Use HTTPS

---

## Common errors

| Problem | Fix |
| --- | --- |
| `Missing required environment variables: MONGO_URI, JWT_SECRET` | Create `server/.env` from `server/.env.example` and fill them in |
| `MongoDB connection failed` / `querySrv ENOTFOUND` | Check `MONGO_URI`, your Atlas password (URL-encode special characters) and Network Access IP allow-list |
| `EADDRINUSE: address already in use :::5000` | Another process uses the port — stop it or change `PORT` (and `VITE_PROXY_TARGET` for the client) |
| Website shows "Cannot reach the server" | The API is not running — start it with `npm run dev` |
| CORS error in production | `CLIENT_URL` must exactly match your site URL (scheme + domain, no trailing slash) |
| Refreshing a page on the live site shows 404 | Add the SPA rewrite (see deployment) or use `SERVE_CLIENT=true` |
| "Too many requests" | Rate limit reached — wait 15 minutes or raise `RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_MAX` |
| Forgot-password says email is not configured | Set the `SMTP_*` variables (in development the link is printed in the server console) |
| Admin link not visible | Make the account an admin: `npm run create-admin -- you@example.com`, then log out and in again |

---

## Known limitations / next steps

- Only **Cash on Delivery** is live. Stripe and SSLCommerz are wired in as disabled providers (`server/services/payment/`) — each file lists the steps to enable it.
- Product ratings / review counts come from the seed data; there is no customer review system yet.
- Coupons are defined in `server/config/promotions.js` (not editable from the admin panel yet).
- Image upload is URL-based; a Cloudinary upload endpoint can be added in `server/services/imageService.js`.
- Order confirmation emails are not sent yet (the email service is ready in `server/services/emailService.js`).
