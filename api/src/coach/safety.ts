/**
 * Hard safety rules, enforced in code whatever the model says.
 * Crisis detection and its messages live in the shared package so the app can
 * show them too; the API is where they are enforced. No humour anywhere here.
 */
export { CRISIS_CARD, CRISIS_MESSAGE, looksLikeCrisis, type Ruleset } from '@wellbeing/shared';
import type { Ruleset } from '@wellbeing/shared';

/**
 * Signs that a reply has drifted into diagnosis or medication, which the coach
 * must never do. A hit replaces the reply with a plain fallback.
 */
const MEDICAL_DRIFT: RegExp[] = [
  /\b\d+(\.\d+)?\s?(mg|mcg|µg|ml|iu|grams? of (melatonin|iron|magnesium|zinc))\b/i,
  /\b(you (probably|likely|might|may|could) have|sounds like you have|this is likely|you are suffering from)\s+(an? )?(depression|anxiety disorder|insomnia disorder|ibs|irritable bowel|coeliac|celiac|diabetes|thyroid|adhd|sleep apnoea|sleep apnea|anaemia|anemia|eating disorder)/i,
  /\b(take|try|start)\s+(a |some |an )?(melatonin|antihistamine|laxative|sleeping pill|antidepressant|ssri|benzodiazepine|zopiclone|diazepam|ibuprofen|paracetamol|omeprazole|antacid|probiotic supplement|iron tablets?|supplement)/i,
  /\bstop taking (your|the)\s+\w+/i,
  // A refusal ("I cannot diagnose") is not drift; the sample run on 2026-11-15 showed R20 replaced wrongly.
  /(?<!\b(?:can'?t|cannot|don'?t|do not|won'?t|will not|not here to|not able to|unable to)\s)\bdiagnos(e|is|ed)\b/i,
];

/**
 * Calories, diets, meal plans, fasting, detox and weight loss are out of bounds
 * too (rule from the teammates' prompt, 2026-11-15): a dietitian's territory,
 * and a risk for anyone with disordered eating.
 */
const DIET_DRIFT: RegExp[] = [
  /\b\d{3,4}\s?(k?cal|calories)\b/i,
  /\bcalorie (deficit|count|counting|target|limit|intake)\b/i,
  /\blose \d+\s?(pounds|lbs|kg|kilos)\b/i,
  /\b(weight[- ]loss|fat[- ]loss|lose weight|burn fat) (plan|diet|programme|program|tips?|advice|goal)\b/i,
  /\bmeal plan\b/i,
  /\b(detox|cleanse)\b/i,
  /\bfast(ing)? for \d+ (days?|hours)\b/i,
  /\bintermittent fasting\b/i,
  /\bskip(ping)? (dinner|breakfast|lunch|meals) to (lose|drop)\b/i,
];

export type DriftKind = 'medical' | 'diet';

export function driftKind(text: string, ruleset: Ruleset = 'current'): DriftKind | null {
  if (MEDICAL_DRIFT.some((p) => p.test(text))) return 'medical';
  if (ruleset === 'current' && DIET_DRIFT.some((p) => p.test(text))) return 'diet';
  return null;
}

export function driftsIntoMedicalAdvice(text: string): boolean {
  return driftKind(text) !== null;
}

export const DIET_FALLBACK =
  "I don't do calories, diets, meal plans or weight-loss advice, even when asked nicely: that part belongs with a dietitian or doctor. What I can help with is the rhythm of eating, like not skipping meals or having something steady in the afternoon. Shall we pick one small thing like that?";

/**
 * Concerns that are not a crisis but need care and a specific resource rather
 * than coaching (added 2026-11-15). The model still replies, told plainly what
 * the person needs; the code forces the CARE behaviour, drops any step, and
 * appends the resource line if the reply left it out.
 */
export type CareKind = 'abuse' | 'eating' | 'alcohol' | 'companion' | 'distress';

const CARE_TRIGGERS: { kind: CareKind; patterns: RegExp[] }[] = [
  {
    kind: 'abuse',
    patterns: [
      /\b(hits|hit|beats|beat|slaps|slapped|hurts|chokes|threatens|threatened) me\b/i,
      /\babus(ive|es me|ed me|ing me)\b/i,
      /\b(scared|afraid|frightened) of (my|him|her|them)\b/i,
      /\bnot safe at home\b/i,
    ],
  },
  {
    kind: 'eating',
    patterns: [
      /\bhaven'?t eaten (in|for) \d+ days?\b/i,
      /\b(not eating|starv(e|ing) myself|skipping meals)\b.{0,40}\b(thinner|lose weight|weight)\b/i,
      /\bon purpose\b.{0,40}\b(thinner|lose weight|skinny)\b/i,
      /\b(purge|purging|make myself (sick|throw up|vomit))\b/i,
    ],
  },
  {
    kind: 'alcohol',
    patterns: [
      /\b(bottle of (wine|vodka|whisky|whiskey|gin|rum)|\d+ (drinks|beers|glasses|shots))\b.{0,50}\b(every night|every day|most nights|most days|each night)\b/i,
      /\bcan'?t stop drinking\b/i,
      /\b(drink|drinking)\b.{0,40}\bcan'?t stop\b/i,
      /\bneed (a|the) drink to\b/i,
    ],
  },
  {
    kind: 'companion',
    patterns: [/\bbe my (friend|companion|girlfriend|boyfriend|partner|only friend)\b/i, /\btalk to me every day\b/i, /\b(only|just) you (understand|listen|get) me\b/i],
  },
  {
    kind: 'distress',
    patterns: [/\bcrying\b/i, /\bcan'?t cope\b/i, /\bbreaking down\b/i, /\bfalling apart\b/i, /\bhopeless\b/i, /\bpanic attacks?\b/i],
  },
];

export function careConcern(text: string | null | undefined, ruleset: Ruleset = 'current'): CareKind | null {
  if (!text || ruleset === 'legacy') return null;
  for (const t of CARE_TRIGGERS) if (t.patterns.some((p) => p.test(text))) return t.kind;
  return null;
}

/** The resource line each concern must carry. US numbers, since the demo is US-only (2026-11-15). */
export const CARE_RESOURCES: Record<CareKind, string> = {
  abuse: 'If you are being hurt at home, the National Domestic Violence Hotline is there 24/7 on 1-800-799-7233 (or text START to 88788). If you are in immediate danger, call 911.',
  eating: 'For eating that has become about weight or control, the National Alliance for Eating Disorders helpline on 1-866-662-1235 will talk it through, free and without judgment.',
  alcohol: 'If drinking has become hard to stop, the SAMHSA National Helpline on 1-800-662-4357 is free, confidential and open 24/7.',
  companion: '',
  distress: 'If it ever feels heavier than you can carry, you can call or text 988 any time, day or night.',
};

/** A token that proves the resource line is present in a reply. */
export const CARE_MARKERS: Record<CareKind, string | null> = {
  abuse: '1-800-799-7233',
  eating: '1-866-662-1235',
  alcohol: '1-800-662-4357',
  companion: null,
  distress: '988',
};

/** Appended to the person's turn for the model only. Plain, no humour. */
export const CARE_HINTS: Record<CareKind, string> = {
  abuse:
    '\n\n(Note to the coach from the app: the person may be being hurt by someone. Set behavior to CARE. Respond with care, put their safety first, give no stress or habit tips and no step, and include this line word for word: "' +
    CARE_RESOURCES.abuse +
    '")',
  eating:
    '\n\n(Note to the coach from the app: this sounds like disordered eating. Set behavior to CARE. Respond with care, give no food, eating or weight advice at all and no step, and include this line word for word: "' +
    CARE_RESOURCES.eating +
    '")',
  alcohol:
    '\n\n(Note to the coach from the app: drinking sounds like it has become hard to stop. Set behavior to CARE. No lecture, no shaming, no step; acknowledge it kindly and include this line word for word: "' +
    CARE_RESOURCES.alcohol +
    '")',
  companion:
    '\n\n(Note to the coach from the app: the person is asking you to be their friend or companion. Set behavior to CARE. Be warm, say kindly what you are (a coach for small habits, not a friend or therapist), and gently point toward people in their life. No step.)',
  distress:
    '\n\n(Note to the coach from the app: the person is in real distress. Set behavior to CARE. Acknowledge it warmly first, gently suggest talking to someone they trust or a professional, still offer your support, and mention lightly that 988 is there any time. No step, no productivity tips.)',
};

/** When an email, phone or ID number was removed from their message. */
export const PII_HINT =
  '\n\n(Note to the coach from the app: an email address, phone number or ID number was removed from this message for privacy. Do not ask for it back. If it was an ID number, gently suggest not sharing details like that here.)';

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
