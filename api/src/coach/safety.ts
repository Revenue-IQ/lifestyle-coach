/**
 * Hard safety rules, enforced in code whatever the model says.
 * Crisis detection and its messages live in the shared package so the app can
 * show them too; the API is where they are enforced. No humour anywhere here.
 */
export { CRISIS_CARD, CRISIS_MESSAGE, looksLikeCrisis } from '@wellbeing/shared';

/**
 * Signs that a reply has drifted into diagnosis or medication, which the coach
 * must never do. A hit replaces the reply with a plain fallback.
 */
const DRIFT_PATTERNS: RegExp[] = [
  /\b\d+(\.\d+)?\s?(mg|mcg|µg|ml|iu|grams? of (melatonin|iron|magnesium|zinc))\b/i,
  /\b(you (probably|likely|might|may|could) have|sounds like you have|this is likely|you are suffering from)\s+(an? )?(depression|anxiety disorder|insomnia disorder|ibs|irritable bowel|coeliac|celiac|diabetes|thyroid|adhd|sleep apnoea|sleep apnea|anaemia|anemia|eating disorder)/i,
  /\b(take|try|start)\s+(a |some |an )?(melatonin|antihistamine|laxative|sleeping pill|antidepressant|ssri|benzodiazepine|zopiclone|diazepam|ibuprofen|paracetamol|omeprazole|antacid|probiotic supplement|iron tablets?|supplement)/i,
  /\bstop taking (your|the)\s+\w+/i,
  /\bdiagnos(e|is|ed)\b/i,
];

export function driftsIntoMedicalAdvice(text: string): boolean {
  return DRIFT_PATTERNS.some((p) => p.test(text));
}

export const DRIFT_FALLBACK =
  'I started to go beyond what I should: I can help with everyday habits, not with diagnosing anything or with medicines or supplements. For that part, a doctor or pharmacist is the right person. Shall we pick one small habit to try this week instead?';

export const UNDER_18_MESSAGE =
  'Our suggestions are written for adults, so the coach is not available under 18. A doctor, school nurse or a trusted adult is the right place to take these questions, and the rest of the app is still yours to use.';

export const PREGNANCY_NOTE =
  'The person is pregnant or breastfeeding. Keep diet advice to general healthy-eating patterns, do not suggest restricting food groups, calories or specific foods, and point to their midwife or doctor for anything specific.';

/** How long a conversation stays in the gentler mode after a crisis notice. */
export const POST_CRISIS_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Added to the prompt while the person is inside that window. */
export const POST_CRISIS_NOTE =
  'IMPORTANT: within the last day this person wrote something that sounded like a crisis, and they were shown a message pointing to a crisis line and their doctor. Do not coach as normal. Open gently, ask how they are doing right now, keep replies short and warm, do not propose any step, and if they ask for help say once, plainly, that a crisis line or their doctor is the right place for the hard part and that you are glad they are here. Follow their lead on whether to talk about habits at all.';

/** Added to the prompt when their earlier free text or conditions line carried crisis language. */
export const DISTRESS_IN_CONTEXT_NOTE =
  'Their own earlier words (quoted in CONTEXT) included signs of real distress. Be gentle and brief, mention once that a professional or crisis line is the right place for the hard part, and do not push a step unless they ask for one.';
