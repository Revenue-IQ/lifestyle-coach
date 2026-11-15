import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireUser, type AuthVariables } from './auth';
import { areas } from './routes/areas';
import { baseline } from './routes/baseline';
import { coach } from './routes/coach';
import { stepRoutes } from './routes/steps';
import { complaints } from './routes/complaints';
import { me } from './routes/me';
import { profile } from './routes/profile';
import { today } from './routes/today';

const api = new Hono<{ Variables: AuthVariables }>()
  .use(requireUser)
  .route('/me', me)
  .route('/profile', profile)
  .route('/complaints', complaints)
  .route('/baseline', baseline)
  .route('/today', today)
  .route('/areas', areas)
  .route('/steps', stepRoutes)
  .route('/', coach);

export const app = new Hono()
  .use(logger())
  .use('/api/*', cors({ origin: (origin) => origin, allowHeaders: ['Content-Type', 'Authorization', 'x-dev-user-id'] }))
  .get('/health', (c) => c.json({ ok: true }))
  .route('/api', api);

/** Shared with the app for Hono's typed client. */
export type AppType = typeof app;

/**
 * In production the same container serves Expo's web build (docs/architecture/deployment.md).
 * WEB_DIST_DIR points at that build; it is unset in local development, where Expo's own dev
 * server serves the app. Registered as statements, not chained, so AppType is unchanged.
 */
const webDistDir = process.env.WEB_DIST_DIR;
if (webDistDir) {
  const indexHtml = readFileSync(join(webDistDir, 'index.html'), 'utf8');
  app.use('*', serveStatic({ root: webDistDir }));
  // Single-page fallback so Expo Router's URLs still load on refresh. Unknown API paths stay 404.
  app.get('*', (c) => (c.req.path.startsWith('/api/') ? c.notFound() : c.html(indexHtml)));
}
