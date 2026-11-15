import { zValidator } from '@hono/zod-validator';
import {
  AREAS,
  AREA_LABELS,
  areaBand,
  cleanAnswers,
  isAreaId,
  MIN_ANSWERED_FOR_FIRM,
  rankAreas,
  rateArea,
  type AreaId,
} from '@wellbeing/shared';
import { and, desc, eq } from 'drizzle-orm';
import { complaintSnapshots } from '../db/schema';

/** The person's latest complaint ids, or none. */
export async function latestComplaintIds(userId: string): Promise<string[]> {
  const latest = await db.query.complaintSnapshots.findFirst({
    where: eq(complaintSnapshots.userId, userId),
    orderBy: desc(complaintSnapshots.createdAt),
  });
  return latest?.complaintIds ?? [];
}
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
  /** What the person's complaints say about this area: a weight and the complaints behind it. */
  signal: { score: number; from: string[] } | null;
  /** "look": flagged by complaints or rated below solid. "rest": everything else. */
  section: 'look' | 'rest';
};

/**
 * Every area with its latest rating and its complaint signal, in the order the
 * home screen shows them: rated areas weakest first, then unrated areas the
 * complaints point at (strongest first), then the rest in display order.
 * This is the one place that decides what is worth a look.
 */
export async function areaStandings(userId: string, complaintIds: string[]): Promise<AreaStanding[]> {
  const rows = await db.query.areaCheckins.findMany({
    where: eq(areaCheckins.userId, userId),
    orderBy: desc(areaCheckins.createdAt),
  });
  const latestByArea = new Map<string, typeof areaCheckins.$inferSelect>();
  for (const r of rows) if (!latestByArea.has(r.area)) latestByArea.set(r.area, r);
  const signals = new Map(rankAreas(complaintIds).map((r) => [r.area, r]));

  const standings: AreaStanding[] = AREAS.map((area) => {
    const row = latestByArea.get(area);
    const latest = row ? presentCheckin(row) : null;
    const ranked = signals.get(area);
    const signal = ranked && ranked.score > 0 ? { score: ranked.score, from: [...new Set(ranked.from)] } : null;
    const worthALook = !!signal || (!!latest && latest.band !== 'solid');
    return { area, label: AREA_LABELS[area], latest, signal, section: worthALook ? 'look' : 'rest' };
  });

  const order = (a: AreaStanding) => AREAS.indexOf(a.area);
  return standings.sort((a, b) => {
    if (a.section !== b.section) return a.section === 'look' ? -1 : 1;
    if (a.latest && b.latest) return a.latest.score - b.latest.score || order(a) - order(b);
    if (a.latest) return -1;
    if (b.latest) return 1;
    return (b.signal?.score ?? 0) - (a.signal?.score ?? 0) || order(a) - order(b);
  });
}

export const areas = new Hono<{ Variables: AuthVariables }>()
  .get('/', async (c) => {
    const user = c.get('user');
    return c.json({ areas: await areaStandings(user.id, await latestComplaintIds(user.id)) });
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
