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
];

export function wantsStep(text: string): boolean {
  return WANTS_STEP.some((p) => p.test(text));
}

/** Appended to the person's turn for the model only; never stored or shown. */
export const WANTS_STEP_HINT =
  '\n\n(Note to the coach from the app: the person is asking for this to be a tracked step. Fill proposedStep with the specific thing you and they have been discussing.)';
