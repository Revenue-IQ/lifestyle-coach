import { verifyToken } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import type { MiddlewareHandler } from 'hono';
import { env } from './config/env';
import { db } from './db/client';
import { users, type User } from './db/schema';

export type AuthVariables = { user: User };

async function clerkUserIdFrom(req: Request): Promise<string | null> {
  if (env.authMode === 'dev') {
    const devId = req.headers.get('x-dev-user-id');
    return devId ? `dev_${devId}` : null;
  }
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = await verifyToken(token, { secretKey: env.clerkSecretKey });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/** Finds the person's row, creating it on first sight. */
async function findOrCreateUser(clerkUserId: string): Promise<User> {
  const existing = await db.query.users.findFirst({ where: eq(users.clerkUserId, clerkUserId) });
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({ clerkUserId })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const raced = await db.query.users.findFirst({ where: eq(users.clerkUserId, clerkUserId) });
  if (!raced) throw new Error('Could not create user');
  return raced;
}

export const requireUser: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const clerkUserId = await clerkUserIdFrom(c.req.raw);
  if (!clerkUserId) return c.json({ error: 'Not signed in' }, 401);
  c.set('user', await findOrCreateUser(clerkUserId));
  await next();
};
