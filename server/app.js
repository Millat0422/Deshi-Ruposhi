import compression from 'compression';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import fs from 'fs';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import apiRoutes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Needed behind a reverse proxy (Render, Railway, Nginx) so rate limiting sees the real IP.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---------- Security headers ----------
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'connect-src': ["'self'", ...env.clientUrls],
        // Don't force https: the site may first be tested on plain http (e.g. a VPS IP).
        'upgrade-insecure-requests': null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ---------- CORS: only our frontend(s) may call the API from a browser ----------
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---------- Body parsing & sanitising ----------
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(mongoSanitize({ replaceWith: '_' })); // strips $ and . keys -> prevents NoSQL injection
app.use(hpp({ whitelist: ['category', 'size', 'color'] })); // prevents HTTP parameter pollution
app.use(compression());

if (!env.isProduction) app.use(morgan('dev'));

// ---------- API ----------
app.use('/api', apiLimiter, apiRoutes);
app.use('/api', notFound);

// ---------- Optional: serve the built React app from the same server ----------
const clientDist = path.resolve(__dirname, '../client/dist');
if (env.serveClient && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '7d', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

export default app;
