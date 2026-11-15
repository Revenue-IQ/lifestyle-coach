/**
 * Crisis detection, shared by the API (which enforces it) and the app (which
 * can show the plain notice before anything is sent). No humour in this file.
 */
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

export function looksLikeCrisis(text: string | null | undefined): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((p) => p.test(text));
}

/** Shown in place of any coaching, wherever crisis language appears. */
export const CRISIS_MESSAGE =
  'It sounds like things are very hard right now, and this app is not the right kind of help for this. Please reach out to someone who is: a crisis line in your country, your doctor, or if you are in immediate danger, your local emergency number. If you are not sure where to turn, findahelpline.com lists free, confidential helplines by country. The app will be here afterwards, and you are welcome back whenever you want.';

/** The shorter version for a card that sits on a screen rather than in a conversation. */
export const CRISIS_CARD =
  'Something you wrote sounds like things are very hard right now. This app is for habits, not for that. Please talk to someone who can help: a crisis line in your country, your doctor, or your local emergency number if you are in danger. findahelpline.com lists free, confidential helplines by country.';
