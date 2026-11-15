import { AREA_LABELS, areaBand, COMPLAINTS, type AreaId } from '@wellbeing/shared';
import { and, asc, desc, eq, gte, isNotNull } from 'drizzle-orm';
import { generateJson, type ChatTurn } from '../ai/gemini';
import { GAME } from '../config/game';
import { db } from '../db/client';
import {
  areaCheckins,
  baselineCheckins,
  complaintSnapshots,
  conversations,
  messages,
  steps,
  type ProposedStep,
  type User,
} from '../db/schema';
import { retrieveNotes, safetyNote, type RetrievedNote } from '../knowledge/retrieve';
import { WANTS_STEP_HINT, wantsStep } from './intent';
import { openingInstruction, REPLY_SCHEMA, systemPrompt, type CoachReply, type ContextPack } from './prompt';
import { CRISIS_MESSAGE, DRIFT_FALLBACK, driftsIntoMedicalAdvice, looksLikeCrisis, POST_CRISIS_WINDOW_MS } from './safety';

/** True when a crisis notice was shown to this person within the window, in any area. */
export async function hadRecentCrisis(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - POST_CRISIS_WINDOW_MS);
  const [row] = await db
    .select({ id: messages.id })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(eq(conversations.userId, userId), eq(messages.noticeKind, 'crisis'), gte(messages.createdAt, since)))
    .limit(1);
  return !!row;
}

export async function buildContext(user: User, area: AreaId, conversationId?: string): Promise<ContextPack> {
  const [rating, complaints, baseline, allSteps, recentCrisis, proposals] = await Promise.all([
    db.query.areaCheckins.findFirst({
      where: and(eq(areaCheckins.userId, user.id), eq(areaCheckins.area, area)),
      orderBy: desc(areaCheckins.createdAt),
    }),
    db.query.complaintSnapshots.findFirst({
      where: eq(complaintSnapshots.userId, user.id),
      orderBy: desc(complaintSnapshots.createdAt),
    }),
    db.query.baselineCheckins.findFirst({
      where: eq(baselineCheckins.userId, user.id),
      orderBy: desc(baselineCheckins.createdAt),
    }),
    db.query.steps.findMany({ where: and(eq(steps.userId, user.id), eq(steps.area, area)) }),
    hadRecentCrisis(user.id),
    conversationId
      ? db.query.messages.findMany({ where: and(eq(messages.conversationId, conversationId), isNotNull(messages.proposedStep)) })
      : Promise.resolve([]),
  ]);
  const labels = new Map(COMPLAINTS.map((c) => [c.id, c.label]));
  const takenUp = new Set(allSteps.map((s) => s.title));
  const pendingProposals = [...new Set(proposals.map((m) => m.proposedStep?.title).filter((t): t is string => !!t && !takenUp.has(t)))];
  return {
    area,
    user,
    rating: rating
      ? { score: rating.score, band: areaBand(rating.score), gaps: rating.gaps, createdAt: rating.createdAt.toISOString() }
      : null,
    complaints: complaints ? complaints.complaintIds.map((id) => labels.get(id) ?? id) : [],
    freeText: complaints?.freeText ?? null,
    baselineScore: baseline?.score ?? null,
    activeSteps: allSteps.filter((s) => s.status === 'active'),
    finishedSteps: allSteps.filter((s) => s.status === 'done'),
    pendingProposals,
    recentCrisis,
    distressInContext: looksLikeCrisis(complaints?.freeText) || looksLikeCrisis(user.conditions),
  };
}

/** The text used to find notes: the gaps plus whatever the person just said. */
function retrievalQuery(ctx: ContextPack, latestUserText: string | null): string {
  const parts = [`${AREA_LABELS[ctx.area]}.`];
  if (ctx.rating?.gaps.length) parts.push(`Gaps: ${ctx.rating.gaps.join('; ')}.`);
  if (ctx.complaints.length) parts.push(`Complaints: ${ctx.complaints.join(', ')}.`);
  if (latestUserText) parts.push(latestUserText);
  return parts.join(' ');
}

function cleanStep(step: ProposedStep | null | undefined): ProposedStep | null {
  if (!step || !step.title?.trim()) return null;
  const target = Number.isInteger(step.targetCount) ? step.targetCount : GAME.defaultStepTarget;
  return {
    title: step.title.trim().slice(0, 80),
    why: (step.why ?? '').trim().slice(0, 240),
    targetCount: Math.min(GAME.maxStepTarget, Math.max(1, target)),
  };
}

async function history(conversationId: string): Promise<ChatTurn[]> {
  const rows = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: asc(messages.createdAt),
  });
  return rows
    .filter((m) => m.role === 'coach' || m.role === 'user')
    .map((m) => ({ role: m.role === 'coach' ? ('model' as const) : ('user' as const), text: m.content }));
}

interface Produced {
  content: string;
  noteIds: string[];
  proposedStep: ProposedStep | null;
  role: 'coach' | 'notice';
  noticeKind?: 'crisis' | 'drift';
}

/** Runs retrieval, the model, and the output checks. Never throws a model error to the user unhandled. */
async function produceReply(ctx: ContextPack, turns: ChatTurn[], latestUserText: string | null): Promise<Produced> {
  const notes: RetrievedNote[] = await retrieveNotes(ctx.area, retrievalQuery(ctx, latestUserText));
  const safety = safetyNote(ctx.area);
  if (safety && !notes.some((n) => n.id === safety.id)) notes.push(safety);

  const out = await generateJson<CoachReply>({
    system: systemPrompt(ctx, notes),
    turns,
    schema: REPLY_SCHEMA as unknown as Record<string, unknown>,
  });

  const reply = (out.reply ?? '').trim();
  if (!reply || driftsIntoMedicalAdvice(reply)) {
    return { content: DRIFT_FALLBACK, noteIds: [], proposedStep: null, role: 'notice', noticeKind: 'drift' };
  }
  const allowed = new Set(notes.map((n) => n.id));
  const noteIds = (out.usedNoteIds ?? []).filter((id) => allowed.has(id));
  let step = cleanStep(out.proposedStep);
  if (step && ctx.activeSteps.length > 0) step = null; // one active step per area, enforced in code
  if (step && ctx.recentCrisis) step = null; // no steps while stepped back after a crisis notice
  if (step && driftsIntoMedicalAdvice(`${step.title} ${step.why}`)) step = null;
  return { content: reply, noteIds, proposedStep: step, role: 'coach' };
}

/** Finds the active conversation for an area, or starts one with an opening message. */
export async function openConversation(user: User, area: AreaId, startOver: boolean) {
  let convo = await db.query.conversations.findFirst({
    where: and(eq(conversations.userId, user.id), eq(conversations.area, area), eq(conversations.active, true)),
  });
  if (convo && startOver) {
    await db.update(conversations).set({ active: false }).where(eq(conversations.id, convo.id));
    convo = undefined;
  }
  // An active conversation with no messages is one whose opening failed; treat it as new.
  if (convo) {
    const first = await db.query.messages.findFirst({ where: eq(messages.conversationId, convo.id) });
    if (!first) {
      await db.delete(conversations).where(eq(conversations.id, convo.id));
      convo = undefined;
    }
  }
  if (!convo) {
    // Generate the opening first, so a failed model call leaves nothing behind.
    const ctx = await buildContext(user, area);
    const produced = await produceReply(ctx, [{ role: 'user', text: openingInstruction(ctx) }], null);
    const [created] = await db.insert(conversations).values({ userId: user.id, area }).returning();
    convo = created;
    await db.insert(messages).values({
      conversationId: convo.id,
      role: produced.role,
      noticeKind: produced.noticeKind ?? null,
      content: produced.content,
      noteIds: produced.noteIds,
      proposedStep: produced.proposedStep,
    });
  }
  return convo;
}

export async function sendMessage(user: User, conversationId: string, text: string) {
  const convo = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, conversationId), eq(conversations.userId, user.id)),
  });
  if (!convo) return null;
  const area = convo.area as AreaId;
  const content = text.trim().slice(0, 1000);

  // Produce the reply first. If the model fails, nothing is stored, so a retry
  // does not leave the person's message in the history twice.
  let produced: Produced;
  if (looksLikeCrisis(content)) {
    produced = { content: CRISIS_MESSAGE, noteIds: [], proposedStep: null, role: 'notice', noticeKind: 'crisis' };
  } else {
    const ctx = await buildContext(user, area, conversationId);
    const turns = await history(conversationId);
    const forModel = wantsStep(content) ? content + WANTS_STEP_HINT : content;
    turns.push({ role: 'user', text: forModel });
    produced = await produceReply(ctx, turns, content);
  }

  await db.insert(messages).values({ conversationId, role: 'user', content });
  const [reply] = await db
    .insert(messages)
    .values({
      conversationId,
      role: produced.role,
      noticeKind: produced.noticeKind ?? null,
      content: produced.content,
      noteIds: produced.noteIds,
      proposedStep: produced.proposedStep,
    })
    .returning();
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
  return reply;
}
