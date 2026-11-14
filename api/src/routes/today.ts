import { zValidator } from '@hono/zod-validator';
import { TODAY_FIELDS } from '@wellbeing/shared';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthVariables } from '../auth';
import { db } from '../db/client';
import { todayCheckins } from '../db/schema';
import { award } from '../game/award';

const bodySchema = z.object({
  mood: z.number().int().min(TODAY_FIELDS.mood.min).max(TODAY_FIELDS.mood.max),
  energy: z.number().int().min(TODAY_FIELDS.energy.min).max(TODAY_FIELDS.energy.max),
  note: z.string().trim().max(TODAY_FIELDS.note.maxLength).optional(),
});

function present(row: typeof todayCheckins.$inferSelect) {
  return {
    id: row.id,
    mood: row.mood,
    energy: row.energy,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export const today = new Hono<{ Variables: AuthVariables }>()
  .get('/', async (c) => {
    const user = c.get('user');
    const rows = await db.query.todayCheckins.findMany({
      where: eq(todayCheckins.userId, user.id),
      orderBy: desc(todayCheckins.createdAt),
      limit: 30,
    });
    return c.json({ checkins: rows.map(present) });
  })
  .post('/', zValidator('json', bodySchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const [row] = await db
      .insert(todayCheckins)
      .values({ userId: user.id, mood: body.mood, energy: body.energy, note: body.note || null })
      .returning();
    const result = await award(user.id, 'today', row.id);
    return c.json({ checkin: present(row), award: result }, 201);
  });
