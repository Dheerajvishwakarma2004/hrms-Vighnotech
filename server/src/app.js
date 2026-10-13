import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import apiRoutes from './routes/index.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(currentDir, '../../client/dist');
const API_PREFIX = /^\/api(\/|$)/;

const corsOptions = {
  origin: (origin, callback) => {
    const allowed =
      !origin || env.CLIENT_URLS.includes('*') || env.CLIENT_URLS.includes(origin.replace(/\/$/, ''));
    callback(null, allowed);
  },
  exposedHeaders: ['Content-Disposition'],
};

const helmetOptions = {
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'blob:'],
      'connect-src': ["'self'"],
      'upgrade-insecure-requests': null,
    },
  },
};

/** Serves the built React app (single-service deployment) with an SPA fallback for non-API routes. */
const serveClient = (app) => {
  const indexHtml = path.join(CLIENT_DIST, 'index.html');
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '7d' }));
  app.get('*', (req, res, next) => {
    if (API_PREFIX.test(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(indexHtml);
  });
};

const createApp = () => {
  const app = express();

  if (env.isProduction) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  if (env.isDevelopment) app.use(morgan('dev'));

  app.use('/api', apiRoutes);

  if (env.isProduction && fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
    serveClient(app);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const app = createApp();

export default app;
