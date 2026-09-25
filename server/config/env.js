// Loads and validates environment variables in ONE place.
// Every other file imports `env` from here instead of reading process.env directly.
import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`\n[config] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[config] Copy server/.env.example to server/.env and fill in the values.\n');
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('[config] JWT_SECRET must be at least 32 characters in production.');
  process.exit(1);
}

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma separated list is allowed: "https://orixa.com,https://www.orixa.com"
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean),
  serveClient: process.env.SERVE_CLIENT === 'true',

  // Store pricing rules (the server is the single source of truth for totals)
  pricing: {
    currency: process.env.CURRENCY || 'USD',
    freeShippingThreshold: toNumber(process.env.FREE_SHIPPING_THRESHOLD, 50),
    shippingFlatRate: toNumber(process.env.SHIPPING_FLAT_RATE, 10),
    taxRate: toNumber(process.env.TAX_RATE, 0.05),
  },

  rateLimit: {
    windowMinutes: toNumber(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
    maxRequests: toNumber(process.env.RATE_LIMIT_MAX, 1000),
    authMax: toNumber(process.env.AUTH_RATE_LIMIT_MAX, 30),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: toNumber(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'ORiXA <no-reply@orixa.com>',
  },

  // Future integrations (not active yet)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
};
