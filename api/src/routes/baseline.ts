import { zValidator } from '@hono/zod-validator';
import { scoreWho5, who5Band, WHO5_QUESTION_COUNT, type Who5Answers } from '@wellbeing/shared';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthVariables } from '../auth';
import { db } from '../db/client';
import { baselineCheckins } from '../db/schema';
import { award } from '../game/award';

const bodySchema = z.object({
  answers: z.array(z.number().int().min(0).max(5)).length(WHO5_QUESTION_COUNT),
});

/**
 * The wording for each band. The "professional" message is plain and comes first,
 * as a hard rule of the backend, not something left to the app.
 */
export const BAND_MESSAGES = {
  professional:
    'Your answers suggest things have been hard lately. This app can help with habits, but it is not a substitute for a person. Please consider talking to your doctor or a mental health professional.',
  low: 'Your wellbeing score is on the low side. That is exactly what this app is for: we will look at sleep, food, movement and the rest to find what might be dragging it down.',
  ok: 'Your wellbeing score is in a reasonable place. We will use it as the starting line and show you how it moves.',
} as const;

function present(row: typeof baselineCheckins.$inferSelect) {
  const band = who5Band(row.score);
  return {
    id: row.id,
    answers: row.answers,
    score: row.score,
    band,
    message: BAND_MESSAGES[band],
    createdAt: row.createdAt.toISOString(),
  };
}

export const baseline = new Hono<{ Variables: AuthVariables }>()
  .get('/', async (c) => {
    const user = c.get('user');
    const rows = await db.query.baselineCheckins.findMany({
      where: eq(baselineCheckins.userId, user.id),
      orderBy: desc(baselineCheckins.createdAt),
    });
    return c.json({ checkins: rows.map(present) });
  })
  .post('/', zValidator('json', bodySchema), async (c) => {
    const user = c.get('user');
    const answers = c.req.valid('json').answers as Who5Answers;
    const score = scoreWho5(answers);
    const [row] = await db
      .insert(baselineCheckins)
      .values({ userId: user.id, answers, score })
      .returning();
    const result = await award(user.id, 'baseline', row.id);
    return c.json({ checkin: present(row), award: result }, 201);
  });
