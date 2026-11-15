/**
 * Small, explicit asks the code recognises in the person's message, so the
 * model is told plainly what they want rather than left to infer it.
 */
const WANTS_STEP: RegExp[] = [
  /\b(add|make|create|set|track|log)\b.{0,30}\bstep\b/i,
  /\bmake it my step\b/i,
  /\btrack (it|this|that)\b/i,
  /\bwon'?t you add\b/i,
  /\byou (didn'?t|did not|won'?t|will not) add\b/i,
  // Direct asks for the result. The sample run on 2026-11-15 showed the why-first rule leaving these unanswered.
  /\bwhat (should|can|could|do) i (try|do)\b/i,
  /\bwhat'?s (my|the|one) (step|thing)\b/i,
  /\bwhat'?s going on with me\b/i,
  /\b(just )?(give|tell) me (one|a|the) (step|thing)\b/i,
];

export function wantsStep(text: string): boolean {
  return WANTS_STEP.some((p) => p.test(text));
}

/** The person wants to replace or drop the step they are on. Checked only when a step is active. */
const WANTS_SWAP: RegExp[] = [
  /\b(swap|replace|change|switch|drop|remove|delete|cancel|scrap|ditch)\b.{0,40}\bstep\b/i,
  /\bstep\b.{0,30}\b(instead|different|another|new one|something else)\b/i,
  /\b(a |an )?(different|another|new) step\b/i,
  /\b(something|anything) else (instead|to try)\b/i,
  /\b(don'?t|do not|can'?t|cannot) (want|like|do) (this|that|the|my) (step|one)\b/i,
];

export function wantsSwap(text: string): boolean {
  return WANTS_SWAP.some((p) => p.test(text));
}

/** Appended to the person's turn for the model only; never stored or shown. */
export const WANTS_STEP_HINT =
  '\n\n(Note to the coach from the app: the person is asking for a step now. Stop asking questions. Give the result in this reply: what is going on, the why, and one small step in proposedStep that fits everything they have told you.)';

export const WANTS_SWAP_HINT =
  '\n\n(Note to the coach from the app: the person wants to replace the step they are on. Propose one different small step in proposedStep; the app will offer to swap when they tap it. Say the swap costs them nothing they have already logged.)';
