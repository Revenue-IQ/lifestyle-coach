import { zValidator } from '@hono/zod-validator';
import { COMPLAINT_IDS, CRISIS_CARD, FREE_TEXT_FIELD, looksLikeCrisis, rankAreas } from '@wellbeing/shared';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthVariables } from '../auth';
import { db } from '../db/client';
import { complaintSnapshots } from '../db/schema';
import { award } from '../game/award';

const bodySchema = z
  .object({
    complaintIds: z.array(z.enum(COMPLAINT_IDS as [string, ...string[]])).max(COMPLAINT_IDS.length),
    freeText: z.string().trim().max(FREE_TEXT_FIELD.maxLength).optional(),
  })
  .refine((b) => b.complaintIds.length > 0 || (b.freeText ?? '').length > 0, {
    message: 'Pick at least one complaint or write a line',
  });

export const complaints = new Hono<{ Variables: AuthVariables }>()
  .get('/', async (c) => {
    const user = c.get('user');
    const rows = await db.query.complaintSnapshots.findMany({
      where: eq(complaintSnapshots.userId, user.id),
      orderBy: desc(complaintSnapshots.createdAt),
    });
    return c.json({
      snapshots: rows.map((r) => ({
        id: r.id,
        complaintIds: r.complaintIds,
        freeText: r.freeText,
        areas: rankAreas(r.complaintIds),
        createdAt: r.createdAt.toISOString(),
      })),
    });
  })
  .post('/', zValidator('json', bodySchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const [row] = await db
      .insert(complaintSnapshots)
      .values({
        userId: user.id,
        complaintIds: [...new Set(body.complaintIds)],
        freeText: body.freeText || null,
      })
      .returning();
    const result = await award(user.id, 'complaints', row.id);
    return c.json(
      {
        snapshot: {
          id: row.id,
          complaintIds: row.complaintIds,
          freeText: row.freeText,
          areas: rankAreas(row.complaintIds),
          createdAt: row.createdAt.toISOString(),
        },
        award: result,
        /** Plain notice when the free text carried crisis language. The app shows it before anything else. */
        notice: looksLikeCrisis(row.freeText) ? CRISIS_CARD : null,
      },
      201,
    );
  });
