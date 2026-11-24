// Builds the Express app (no DB connection, no listen) so tests can use it directly.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { ok } from './lib/http.js';
import { loadUser } from './middleware/auth.js';
import { sameOrigin } from './middleware/sameOrigin.js';
import { errorHandler, notFound } from './middleware/error.js';
import { registerModules } from './modules/index.js';

export function createApp({ extraRoutes } = {}) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: env.isProd
        ? {
            directives: {
              'default-src': ["'self'"],
              'img-src': ["'self'", 'data:', 'blob:'],
              'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              'font-src': ["'self'", 'https://fonts.gstatic.com'],
              'script-src': ["'self'", "'unsafe-inline'"],
            },
          }
        : false,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(env.uploadsDir, { fallthrough: false, index: false }));
  app.use('/api', sameOrigin, loadUser);

  app.get('/api/health', (_req, res) => ok(res, { status: 'up' }));
  registerModules(app);
  if (extraRoutes) extraRoutes(app);
  app.use('/api', notFound);

  // Production: serve the built React app with an SPA fallback.
  const dist = path.resolve(env.serverRoot, '../client/dist');
  if (env.isProd && fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
