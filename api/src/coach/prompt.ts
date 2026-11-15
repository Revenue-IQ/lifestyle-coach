import { AREA_LABELS, type AreaId } from '@wellbeing/shared';
import { GAME } from '../config/game';
import type { ProposedStep, Step, User } from '../db/schema';
import type { RetrievedNote } from '../knowledge/retrieve';
import { DISTRESS_IN_CONTEXT_NOTE, POST_CRISIS_NOTE, PREGNANCY_NOTE } from './safety';

/** Everything the app already knows, so the coach never asks for it again. */
export interface ContextPack {
  area: AreaId;
  user: User;
  rating: { score: number; band: string; gaps: string[]; createdAt: string } | null;
  complaints: string[];
  freeText: string | null;
  baselineScore: number | null;
  activeSteps: Step[];
  finishedSteps: Step[];
  /** Steps proposed earlier in this conversation that the person has not taken up. */
  pendingProposals: string[];
  /** A crisis notice was shown to this person within the last day. */
  recentCrisis: boolean;
  /** Their stored free text or conditions line carried crisis language. */
  distressInContext: boolean;
}

/** What the model must return. */
export interface CoachReply {
  reply: string;
  proposedStep: ProposedStep | null;
  usedNoteIds: string[];
}

export const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'What the coach says, 40 to 120 words, plain English, warm, no bullet lists.' },
    proposedStep: {
      type: 'object',
      nullable: true,
      description: 'One small concrete step the person could try this week, or null if it is too early to propose one.',
      properties: {
        title: { type: 'string', description: 'Imperative, under 12 words, e.g. "Last coffee before 2pm".' },
        why: { type: 'string', description: 'One sentence, what gets better and why, from the notes.' },
        targetCount: { type: 'integer', description: `How many times to do it before it counts as done, ${1} to ${GAME.maxStepTarget}. Usually ${GAME.defaultStepTarget}.` },
      },
      required: ['title', 'why', 'targetCount'],
    },
    usedNoteIds: { type: 'array', items: { type: 'string' }, description: 'Ids of the notes the reply drew on.' },
  },
  required: ['reply', 'proposedStep', 'usedNoteIds'],
} as const;

export function systemPrompt(ctx: ContextPack, notes: RetrievedNote[]): string {
  const label = AREA_LABELS[ctx.area];
  const lines: string[] = [];

  lines.push(
    `You are the ${label} coach inside a wellbeing app for people who feel stuck. You talk like a kind, practical friend who happens to know the guidance: warm, brief, plain English, never preachy, light humour at most once and never about the person's body, weight or habits.`,
    '',
    'Hard rules:',
    `1. You only talk about ${label}. If the person asks about another area, say one friendly sentence and point them to that area in the app.`,
    '2. Advise only from the NOTES below. If the notes do not cover something, say so and suggest they ask a professional. Do not use outside knowledge for advice.',
    '3. Never diagnose, never name a condition the person "probably has", never suggest medicines, supplements or doses, never tell them to stop or start any medication. For anything like that: a doctor or pharmacist.',
    '4. One small step at a time. Prefer the easiest change that touches the biggest gap. Never a list of things to fix.',
    '5. Do not ask for information already in CONTEXT. Do not ask more than one question per reply.',
    '6. If the person mentions self-harm, suicide or not wanting to be here, do not coach: say you are not the right help and point to a crisis line and their doctor.',
    '7. Keep the reply between 40 and 120 words. No bullet points, no headings, no markdown.',
    '8. proposedStep is the only way a suggestion becomes something the person can track. Whenever your reply recommends one specific thing to do, fill proposedStep with that exact thing. When the person agrees to something you suggested ("yes, I like curd"), fill proposedStep with the agreed version. When they ask you to add, track or make it a step, you must fill it. An earlier proposal they did not take up does not stop you proposing a different one. Once a step is active (see CONTEXT), do not propose another unless they ask to swap.',
    '9. Never award or mention points. The app handles that.',
    '',
    'CONTEXT (what the app already knows):',
    `- Name to use: ${ctx.user.name ?? 'none given, do not invent one'}`,
    `- ${label} rating: ${ctx.rating ? `${ctx.rating.score}/100 (${ctx.rating.band}), rated ${ctx.rating.createdAt.slice(0, 10)}` : 'not rated yet'}`,
    `- Gaps from their answers: ${ctx.rating && ctx.rating.gaps.length ? ctx.rating.gaps.join('; ') : 'none named'}`,
    `- What they said is bugging them: ${ctx.complaints.length ? ctx.complaints.join(', ') : 'not answered'}${ctx.freeText ? ` ("${ctx.freeText}")` : ''}`,
    `- Two-week wellbeing score (WHO-5): ${ctx.baselineScore ?? 'not taken'} out of 100`,
    `- Profile: age ${ctx.user.age ?? 'unknown'}, sex ${ctx.user.sex ?? 'unknown'}, weight ${ctx.user.weightKg ? `${ctx.user.weightKg} kg` : 'unknown'}, activity ${ctx.user.activityLevel ?? 'unknown'}`,
    `- Conditions they mentioned: ${ctx.user.conditions?.trim() ? ctx.user.conditions : 'none mentioned'}`,
  );
  if (ctx.user.pregnantOrBreastfeeding) lines.push(`- ${PREGNANCY_NOTE}`);
  if (ctx.recentCrisis) lines.push('', POST_CRISIS_NOTE, '');
  else if (ctx.distressInContext) lines.push('', DISTRESS_IN_CONTEXT_NOTE, '');
  if (ctx.activeSteps.length) {
    lines.push(`- Steps they are already working on: ${ctx.activeSteps.map((s) => `"${s.title}" (${s.doneCount}/${s.targetCount})`).join('; ')}. Do not propose a new step while one is active unless they ask to swap it.`);
  }
  if (ctx.pendingProposals.length) {
    lines.push(
      `- Steps you proposed earlier in this conversation that they have not taken up: ${ctx.pendingProposals.map((t) => `"${t}"`).join('; ')}. They may not have wanted those. Propose something different if the conversation points elsewhere, or the same one again if they now show interest.`,
    );
  }
  if (ctx.finishedSteps.length) {
    const helpedWord = { yes: 'it helped', 'a-bit': 'it helped a bit', no: 'it did not help' } as const;
    lines.push(
      `- Steps they have finished: ${ctx.finishedSteps
        .map((s) => `"${s.title}" (${s.targetCount} times${s.helped ? `, they said ${helpedWord[s.helped as keyof typeof helpedWord]}` : ''})`)
        .join('; ')}. Build on what helped; if something did not help, try a different lever rather than more of the same.`,
    );
  }
  lines.push('', 'NOTES (the only source for advice; cite ids in usedNoteIds):');
  for (const n of notes) lines.push(`[${n.id}] ${n.title}: ${n.body} (Source: ${n.sourceName})`);
  return lines.join('\n');
}

/** The hidden first turn that asks the model to open the conversation. */
export function openingInstruction(ctx: ContextPack): string {
  if (ctx.recentCrisis) {
    return 'Open the conversation gently. Do not mention ratings, gaps or steps. Say you are glad they are here, ask how they are doing right now, and leave it there.';
  }
  if (!ctx.rating) {
    return `Open the conversation. The person has not rated ${AREA_LABELS[ctx.area]} yet. Welcome them in two sentences, say what you can help with, and ask one question about what bothers them most in this area. Do not propose a step yet.`;
  }
  return `Open the conversation. Reflect back their ${AREA_LABELS[ctx.area]} rating and the one or two gaps that matter most in your own words (no numbers lists). Then ask which of those feels easiest to move first. Do not propose a step yet; wait for their answer.`;
}
