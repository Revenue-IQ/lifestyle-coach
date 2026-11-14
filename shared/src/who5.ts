/**
 * The WHO-5 Well-Being Index, used word for word with attribution.
 * See docs/features/wellbeing-check-in.md for scoring, thresholds and licensing.
 */
export const WHO5_INTRO = 'Over the last two weeks...';

export const WHO5_QUESTIONS = [
  'I have felt cheerful and in good spirits',
  'I have felt calm and relaxed',
  'I have felt active and vigorous',
  'I woke up feeling fresh and rested',
  'My daily life has been filled with things that interest me',
] as const;

export const WHO5_SCALE = [
  { value: 5, label: 'All of the time' },
  { value: 4, label: 'Most of the time' },
  { value: 3, label: 'More than half of the time' },
  { value: 2, label: 'Less than half of the time' },
  { value: 1, label: 'Some of the time' },
  { value: 0, label: 'At no time' },
] as const;

export const WHO5_ATTRIBUTION =
  'WHO-5 Well-Being Index. Psychiatric Research Unit, Mental Health Centre North Zealand, on behalf of the World Health Organization.';

export const WHO5_QUESTION_COUNT = WHO5_QUESTIONS.length;

/** Published cut-offs. 28 or below: suggest talking to a professional. 50 or below: low wellbeing. */
export const WHO5_PROFESSIONAL_THRESHOLD = 28;
export const WHO5_LOW_THRESHOLD = 50;

export type Who5Answers = [number, number, number, number, number];

export function isValidWho5Answers(answers: unknown): answers is Who5Answers {
  return (
    Array.isArray(answers) &&
    answers.length === WHO5_QUESTION_COUNT &&
    answers.every((a) => Number.isInteger(a) && a >= 0 && a <= 5)
  );
}

/** Raw total 0 to 25, times 4, gives the 0 to 100 score. */
export function scoreWho5(answers: Who5Answers): number {
  if (!isValidWho5Answers(answers)) throw new Error('WHO-5 needs five answers from 0 to 5');
  return answers.reduce((sum, a) => sum + a, 0) * 4;
}

export type Who5Band = 'professional' | 'low' | 'ok';

export function who5Band(score: number): Who5Band {
  if (score <= WHO5_PROFESSIONAL_THRESHOLD) return 'professional';
  if (score <= WHO5_LOW_THRESHOLD) return 'low';
  return 'ok';
}
