/**
 * Crisis detection, shared by the API (which enforces it) and the app (which
 * can show the plain notice before anything is sent). No humour in this file.
 */
/** 'legacy' is the coach as it was before 2026-11-15, kept only so evals can measure before and after. */
export type Ruleset = 'current' | 'legacy';

const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid/i,
  /\bkill(ing|ed)? myself\b/i,
  /\bend (it all|my life)\b/i,
  /\b(want|wanted|wish) to (die|be dead|disappear)\b/i,
  /\bdon'?t want to (be here|live|wake up)\b/i,
  /\bself[- ]?harm/i,
  /\bhurt(ing)? myself\b/i,
  /\bno reason to (live|go on)\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\boverdos/i,
  /\bnot worth living\b/i,
];

/** Added 2026-11-15 from the teammates' red-team set. Kept narrow: "work is killing me lol" must not match. */
const CRISIS_PATTERNS_ADDED: RegExp[] = [
  /\b(thinking about|thought about|considering|planning on) ending (it|things|everything)\b/i,
  /\bending it all\b/i,
  /\b(no|what'?s the|don'?t see the|can'?t see the) point (of|in) (going on|living|carrying on|any of (it|this))\b/i,
  /\b(wish|hope|want|wanted|hoping|wishing)\b.{0,20}\b(wouldn'?t|won'?t|never|didn'?t|not) wake up\b/i,
  /\bto not wake up\b/i,
  /\bkms\b/i,
  /\bcutting myself\b/i,
  /\bhow many (sleeping )?pills\b/i,
  /\bpills (is|are|would be) too many\b/i,
  /\bcan'?t (do this|go on|keep going|take (it|this)) anymore\b/i,
  /\bno quiero vivir\b/i,
  /\bquiero morir(me)?\b/i,
];

export function looksLikeCrisis(text: string | null | undefined, ruleset: Ruleset = 'current'): boolean {
  if (!text) return false;
  if (CRISIS_PATTERNS.some((p) => p.test(text))) return true;
  return ruleset === 'current' && CRISIS_PATTERNS_ADDED.some((p) => p.test(text));
}

/**
 * The demo is US-only for now (decided 2026-11-15), so 988 comes first; the
 * country-neutral finder stays for anyone else.
 */
export const CRISIS_LINE = 'In the US, call or text 988, the Suicide and Crisis Lifeline, any time.';

/** One line on every screen. Plain, no humour. */
export const FOOTER_DISCLAIMER = 'Not therapy or a diagnosis. In crisis? Call or text 988.';

/** Shown in place of any coaching, wherever crisis language appears. */
export const CRISIS_MESSAGE =
  `It sounds like things are very hard right now, and this app is not the right kind of help for this. Please reach out to someone who is. ${CRISIS_LINE} Your doctor is another good place to start, and if you are in immediate danger, call your local emergency number. Outside the US, findahelpline.com lists free, confidential helplines by country. The app will be here afterwards, and you are welcome back whenever you want.`;

/**
 * Shown on the result screen when a "feeling low" or "nothing feels fun" card
 * was picked. Low mood is not a crisis; this points at the two-week check-in
 * and says where help is if things are heavier. No humour.
 */
export const LOW_MOOD_SUPPORT =
  `Feeling low or flat for a while is common, and worth taking seriously. If it has lasted more than two weeks, a doctor or therapist is the right next step, and the two-week check-in here gives you a number to bring along. If things ever feel heavier than that, call or text 988, the Suicide and Crisis Lifeline, any time (US).`;

/** The shorter version for a card that sits on a screen rather than in a conversation. */
export const CRISIS_CARD =
  `Something you wrote sounds like things are very hard right now. This app is for habits, not for that. Please talk to someone who can help. ${CRISIS_LINE} Your doctor can help too, and if you are in danger, call your local emergency number. Outside the US, findahelpline.com lists free, confidential helplines by country.`;
