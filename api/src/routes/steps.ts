import { zValidator } from '@hono/zod-validator';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthVariables } from '../auth';
import { db } from '../db/client';
import { stepLogs, steps } from '../db/schema';
import { award, type Award } from '../game/award';
import { finishBonus, nextRungTarget } from '../game/ladder';
import { presentStep } from './coach';

const HELPED = ['yes', 'a-bit', 'no'] as const;

async function ownStep(userId: string, id: string) {
  return db.query.steps.findFirst({ where: and(eq(steps.id, id), eq(steps.userId, userId)) });
}

/**
 * The steps a person agreed with the coach: counted, never dated.
 * A finished step asks "did it help?" and offers the next rung of the ladder.
 */
export const stepRoutes = new Hono<{ Variables: AuthVariables }>()
  .get('/', async (c) => {
    const user = c.get('user');
    const rows = await db.query.steps.findMany({
      where: eq(steps.userId, user.id),
      orderBy: desc(steps.createdAt),
      limit: 50,
    });
    return c.json({ steps: rows.map(presentStep) });
  })
  /** "I did it." Points once per step per day; finishing a rung earns its bonus once. */
  .post('/:id/log', zValidator('json', z.object({ note: z.string().trim().max(200).optional() })), async (c) => {
    const user = c.get('user');
    const step = await ownStep(user.id, c.req.param('id'));
    if (!step) return c.json({ error: 'No such step' }, 404);
    if (step.status !== 'active') return c.json({ error: 'That step is not active' }, 409);

    await db.insert(stepLogs).values({ stepId: step.id, userId: user.id, note: c.req.valid('json').note || null });
    const doneCount = step.doneCount + 1;
    const finished = doneCount >= step.targetCount;
    const [updated] = await db
      .update(steps)
      .set({ doneCount, status: finished ? 'done' : 'active', completedAt: finished ? new Date() : null })
      .where(eq(steps.id, step.id))
      .returning();

    let result: Award = await award(user.id, 'step-log', step.id);
    if (finished) {
      const bonus = await award(user.id, 'step-done', step.id, finishBonus(step.targetCount));
      if (!bonus.capped) {
        result = { ...bonus, points: result.points + bonus.points, reason: 'for finishing a step', leveledUp: result.leveledUp || bonus.leveledUp };
      }
    }
    return c.json({ step: presentStep(updated), award: result, finished });
  })
  /** Did it help? Asked once after a step is finished. No points: honesty is the point. */
  .post('/:id/reflect', zValidator('json', z.object({ helped: z.enum(HELPED) })), async (c) => {
    const user = c.get('user');
    const step = await ownStep(user.id, c.req.param('id'));
    if (!step) return c.json({ error: 'No such step' }, 404);
    if (step.status !== 'done') return c.json({ error: 'That step is not finished yet' }, 409);
    const [updated] = await db.update(steps).set({ helped: c.req.valid('json').helped }).where(eq(steps.id, step.id)).returning();
    return c.json({ step: presentStep(updated) });
  })
  /** Keep going: the same step at the next rung of the ladder, as a new active step. */
  .post('/:id/continue', async (c) => {
    const user = c.get('user');
    const step = await ownStep(user.id, c.req.param('id'));
    if (!step) return c.json({ error: 'No such step' }, 404);
    if (step.status !== 'done') return c.json({ error: 'Finish this rung first' }, 409);
    if (step.followUp) return c.json({ error: 'This step has already been followed up' }, 409);
    const target = nextRungTarget(step.targetCount);
    if (target === null) return c.json({ error: 'This step is at the top of the ladder. That is a habit now.' }, 409);
    const active = await db.query.steps.findFirst({
      where: and(eq(steps.userId, user.id), eq(steps.area, step.area), eq(steps.status, 'active')),
    });
    if (active) return c.json({ error: 'You already have a step going in this area. Finish or drop it first.' }, 409);
    const [next] = await db
      .insert(steps)
      .values({
        userId: user.id,
        area: step.area,
        conversationId: step.conversationId,
        title: step.title,
        why: step.why,
        noteIds: step.noteIds,
        targetCount: target,
        parentStepId: step.id,
      })
      .returning();
    await db.update(steps).set({ followUp: 'continued' }).where(eq(steps.id, step.id));
    return c.json({ step: presentStep(next) }, 201);
  })
  /** Enough for now: closes the follow-up question without starting a new rung. */
  .post('/:id/close', async (c) => {
    const user = c.get('user');
    const step = await ownStep(user.id, c.req.param('id'));
    if (!step) return c.json({ error: 'No such step' }, 404);
    if (step.status !== 'done') return c.json({ error: 'That step is not finished yet' }, 409);
    const [updated] = await db.update(steps).set({ followUp: 'closed' }).where(eq(steps.id, step.id)).returning();
    return c.json({ step: presentStep(updated) });
  })
  /** Dropping a step costs nothing and keeps what was logged. */
  .post('/:id/drop', async (c) => {
    const user = c.get('user');
    const step = await ownStep(user.id, c.req.param('id'));
    if (!step) return c.json({ error: 'No such step' }, 404);
    const [updated] = await db.update(steps).set({ status: 'dropped' }).where(eq(steps.id, step.id)).returning();
    return c.json({ step: presentStep(updated) });
  });
