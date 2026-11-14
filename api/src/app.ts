import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requireUser, type AuthVariables } from './auth';
import { baseline } from './routes/baseline';
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
  .route('/today', today);

export const app = new Hono()
  .use(logger())
  .use('/api/*', cors({ origin: (origin) => origin, allowHeaders: ['Content-Type', 'Authorization', 'x-dev-user-id'] }))
  .get('/health', (c) => c.json({ ok: true }))
  .route('/api', api);

/** Shared with the app for Hono's typed client. */
export type AppType = typeof app;
