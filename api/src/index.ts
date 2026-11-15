import { serve } from '@hono/node-server';
import dns from 'node:dns';
import { app } from './app';
import { env } from './config/env';

// Outbound calls (Gemini) try IPv4 first. On 2026-11-14 a single flaky IPv6 route to
// Google's API host made the coach fail with a connect timeout while IPv4 was fine.
dns.setDefaultResultOrder('ipv4first');

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`API listening on http://localhost:${info.port} (auth: ${env.authMode})`);
});
