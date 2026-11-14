import { zValidator } from '@hono/zod-validator';
import {
  AREAS,
  AREA_LABELS,
  areaBand,
  cleanAnswers,
  isAreaId,
  MIN_ANSWERED_FOR_FIRM,
  rateArea,
  type AreaId,
} from '@wellbeing/shared';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthVariables } from '../auth';
import { db } from '../db/client';
import { areaCheckins } from '../db/schema';
import { award } from '../game/award';

const bodySchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export function presentCheckin(row: typeof areaCheckins.$inferSelect) {
  return {
    id: row.id,
    area: row.area as AreaId,
    answers: row.answers,
    score: row.score,
    band: areaBand(row.score),
    answered: row.answered,
    rough: row.answered < MIN_ANSWERED_FOR_FIRM,
    gaps: row.gaps,
    createdAt: row.createdAt.toISOString(),
  };
}

export type AreaStanding = {
  area: AreaId;
  label: string;
  latest: ReturnType<typeof presentCheckin> | null;
};

/**
 * Every area with its latest rating, weakest first. Unrated areas come after
 * rated ones, in display order, so the top of the list is where to start.
 */
export async function areaStandings(userId: string): Promise<AreaStanding[]> {
  const rows = await db.query.areaCheckins.findMany({
    where: eq(areaCheckins.userId, userId),
    orderBy: desc(areaCheckins.createdAt),
  });
  const latestByArea = new Map<string, typeof areaCheckins.$inferSelect>();
  for (const r of rows) if (!latestByArea.has(r.area)) latestByArea.set(r.area, r);
  const standings: AreaStanding[] = AREAS.map((area) => {
    const latest = latestByArea.get(area);
    return { area, label: AREA_LABELS[area], latest: latest ? presentCheckin(latest) : null };
  });
  return standings.sort((a, b) => {
    if (a.latest && b.latest) return a.latest.score - b.latest.score || AREAS.indexOf(a.area) - AREAS.indexOf(b.area);
    if (a.latest) return -1;
    if (b.latest) return 1;
    return AREAS.indexOf(a.area) - AREAS.indexOf(b.area);
  });
}

export const areas = new Hono<{ Variables: AuthVariables }>()
  .get('/', async (c) => {
    const user = c.get('user');
    return c.json({ areas: await areaStandings(user.id) });
  })
  .get('/:area', async (c) => {
    const user = c.get('user');
    const area = c.req.param('area');
    if (!isAreaId(area)) return c.json({ error: 'Unknown area' }, 404);
    const rows = await db.query.areaCheckins.findMany({
      where: and(eq(areaCheckins.userId, user.id), eq(areaCheckins.area, area)),
      orderBy: desc(areaCheckins.createdAt),
      limit: 20,
    });
    return c.json({ area, label: AREA_LABELS[area], checkins: rows.map(presentCheckin) });
  })
  .post('/:area/checkins', zValidator('json', bodySchema), async (c) => {
    const user = c.get('user');
    const area = c.req.param('area');
    if (!isAreaId(area)) return c.json({ error: 'Unknown area' }, 404);
    const answers = cleanAnswers(area, c.req.valid('json').answers);
    const rating = rateArea(area, answers);
    if (rating.score === null) return c.json({ error: 'Answer at least one question to get a rating' }, 400);
    const [row] = await db
      .insert(areaCheckins)
      .values({ userId: user.id, area, answers, score: rating.score, answered: rating.answered, gaps: rating.gaps })
      .returning();
    const result = await award(user.id, 'area-checkin', area);
    return c.json({ checkin: presentCheckin(row), award: result }, 201);
  });
