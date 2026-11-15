import { zValidator } from '@hono/zod-validator';
import { AREAS, isAreaId, type AreaId } from '@wellbeing/shared';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { AiBusyError, AiUnavailableError, aiEnabled } from '../ai/gemini';
import { env } from '../config/env';
import type { AuthVariables } from '../auth';
import { UNDER_18_MESSAGE } from '../coach/safety';
import { openConversation, sendMessage } from '../coach/service';
import { db } from '../db/client';
import { conversations, knowledgeNotes, messages, steps, type User } from '../db/schema';
import { nextRungTarget, rungIndex } from '../game/ladder';
import { notesForArea } from '../knowledge/notes';

/**
 * What must be answered before the coach opens. Over 18 for every area;
 * pregnancy or breastfeeding for Diet. Asked once, stored on the profile.
 */
export function gatesFor(user: User, area: AreaId): ('over18' | 'pregnantOrBreastfeeding')[] {
  const gates: ('over18' | 'pregnantOrBreastfeeding')[] = [];
  if (user.over18 === null || user.over18 === undefined) gates.push('over18');
  if (area === 'diet' && (user.pregnantOrBreastfeeding === null || user.pregnantOrBreastfeeding === undefined)) {
    gates.push('pregnantOrBreastfeeding');
  }
  return gates;
}

async function presentConversation(conversationId: string) {
  const rows = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: asc(messages.createdAt),
  });
  const ids = [...new Set(rows.flatMap((m) => m.noteIds))];
  const sources = ids.length
    ? await db
        .select({ id: knowledgeNotes.id, title: knowledgeNotes.title, sourceName: knowledgeNotes.sourceName, sourceUrl: knowledgeNotes.sourceUrl })
        .from(knowledgeNotes)
        .where(inArray(knowledgeNotes.id, ids))
    : [];
  // Notes not loaded into the database yet (tag fallback) are looked up from the seed file.
  const byId = new Map(sources.map((s) => [s.id, s]));
  for (const id of ids) {
    if (!byId.has(id)) {
      const seed = AREAS.flatMap((a) => notesForArea(a)).find((n) => n.id === id);
      if (seed) byId.set(id, { id, title: seed.title, sourceName: seed.source.name, sourceUrl: seed.source.url });
    }
  }
  return rows.map((m) => ({
    id: m.id,
    role: m.role as 'coach' | 'user' | 'notice',
    behavior: (m.behavior ?? (m.role === 'notice' ? (m.noticeKind === 'crisis' ? 'CARE' : 'DECLINE') : m.role === 'coach' ? 'ANSWER' : null)) as
      | 'ANSWER'
      | 'DECLINE'
      | 'CARE'
      | null,
    content: m.content,
    proposedStep: m.proposedStep ?? null,
    sources: m.noteIds.map((id) => byId.get(id)).filter((s): s is NonNullable<typeof s> => !!s),
    createdAt: m.createdAt.toISOString(),
  }));
}

const UNAVAILABLE = 'The coach is not switched on yet: the API needs a GEMINI_API_KEY.';

/**
 * Evals send x-coach-ruleset: legacy to replay the coach as it was before
 * 2026-11-15 (docs/features/evals.md). Honoured in dev auth mode only; real
 * people always get the current rules.
 */
function rulesetFor(header: string | undefined): 'current' | 'legacy' {
  return env.authMode === 'dev' && header === 'legacy' ? 'legacy' : 'current';
}

export const coach = new Hono<{ Variables: AuthVariables }>()
  /** Opens (or resumes) the coach for an area. Returns gates to answer first when needed. */
  .post('/areas/:area/coach', zValidator('json', z.object({ startOver: z.boolean().optional() })), async (c) => {
    const user = c.get('user');
    const area = c.req.param('area');
    if (!isAreaId(area)) return c.json({ error: 'Unknown area' }, 404);
    const gates = gatesFor(user, area);
    if (gates.length > 0) return c.json({ status: 'gates' as const, gates });
    if (user.over18 === false) return c.json({ status: 'under18' as const, message: UNDER_18_MESSAGE });
    if (!aiEnabled()) return c.json({ error: UNAVAILABLE }, 503);
    let convo;
    try {
      convo = await openConversation(user, area, c.req.valid('json').startOver ?? false, rulesetFor(c.req.header('x-coach-ruleset')));
    } catch (err) {
      if (err instanceof AiUnavailableError) return c.json({ error: UNAVAILABLE }, 503);
      if (err instanceof AiBusyError) return c.json({ error: err.message }, 503);
      console.error('[coach] open failed', err);
      return c.json({ error: 'The coach could not answer just now. Try again in a moment; nothing is lost.' }, 503);
    }
    return c.json({
      status: 'open' as const,
      conversation: { id: convo.id, area, createdAt: convo.createdAt.toISOString() },
      messages: await presentConversation(convo.id),
    });
  })
  .post('/coach/:id/messages', zValidator('json', z.object({ content: z.string().trim().min(1).max(1000) })), async (c) => {
    const user = c.get('user');
    if (!aiEnabled()) return c.json({ error: UNAVAILABLE }, 503);
    let reply;
    try {
      reply = await sendMessage(user, c.req.param('id'), c.req.valid('json').content, rulesetFor(c.req.header('x-coach-ruleset')));
    } catch (err) {
      if (err instanceof AiBusyError) return c.json({ error: err.message }, 503);
      console.error('[coach] reply failed', err);
      return c.json({ error: 'The coach could not answer just now. Try again in a moment; nothing you typed is lost.' }, 503);
    }
    if (!reply) return c.json({ error: 'No such conversation' }, 404);
    return c.json({ messages: await presentConversation(c.req.param('id')) });
  })
  /** Turns the step a coach message proposed into the person's step for that area. */
  .post('/coach/:id/steps', zValidator('json', z.object({ messageId: z.string().uuid() })), async (c) => {
    const user = c.get('user');
    const convo = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, c.req.param('id')), eq(conversations.userId, user.id)),
    });
    if (!convo) return c.json({ error: 'No such conversation' }, 404);
    const msg = await db.query.messages.findFirst({
      where: and(eq(messages.id, c.req.valid('json').messageId), eq(messages.conversationId, convo.id)),
    });
    if (!msg?.proposedStep) return c.json({ error: 'That message did not propose a step' }, 400);
    const active = await db.query.steps.findFirst({
      where: and(eq(steps.userId, user.id), eq(steps.area, convo.area), eq(steps.status, 'active')),
    });
    if (active && msg.proposedStep.replacesStepId === active.id) {
      // The person asked the coach for a different step and tapped the swap: the old one is
      // dropped, not deleted, so everything logged against it stays theirs.
      await db.update(steps).set({ status: 'dropped' }).where(eq(steps.id, active.id));
    } else if (active) {
      return c.json({ error: 'You already have a step going in this area. Finish or drop it first.' }, 409);
    }
    const [step] = await db
      .insert(steps)
      .values({
        userId: user.id,
        area: convo.area,
        conversationId: convo.id,
        title: msg.proposedStep.title,
        why: msg.proposedStep.why,
        noteIds: msg.noteIds,
        targetCount: msg.proposedStep.targetCount,
      })
      .returning();
    return c.json({ step: presentStep(step) }, 201);
  });

export function presentStep(s: typeof steps.$inferSelect) {
  return {
    id: s.id,
    area: s.area as AreaId,
    title: s.title,
    why: s.why,
    targetCount: s.targetCount,
    doneCount: s.doneCount,
    status: s.status as 'active' | 'done' | 'dropped',
    helped: s.helped as 'yes' | 'a-bit' | 'no' | null,
    followUp: s.followUp as 'continued' | 'closed' | null,
    /** The next rung's target if the person keeps going, or null at the top of the ladder. */
    nextTarget: nextRungTarget(s.targetCount),
    rung: rungIndex(s.targetCount) + 1,
    createdAt: s.createdAt.toISOString(),
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
  };
}
