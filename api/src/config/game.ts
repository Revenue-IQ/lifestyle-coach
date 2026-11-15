/**
 * The one place for every game number. See the gamification skill.
 * Points reward the act of adding information, whatever it says.
 * Nothing here ever makes a total go down.
 */
export const AWARD_KINDS = [
  'complaints',
  'name',
  'baseline',
  'today',
  'profile-field',
  'area-checkin',
  'step-log',
  'step-done',
] as const;
export type AwardKind = (typeof AWARD_KINDS)[number];

/**
 * How often a kind earns points.
 * - perDay: this many per calendar day (UTC). With perRef, the count is per reference
 *   (for example per area), so rating two areas in one day earns twice.
 * - once: once ever, per reference when one is given (for example per profile field).
 * Entries beyond a cap are still stored; they just earn nothing that time.
 */
export type Cap = { perDay: number; perRef?: boolean } | { once: true };

export const GAME = {
  /** Points for one contribution of each kind. */
  points: {
    complaints: 20,
    name: 10,
    baseline: 30,
    today: 5,
    'profile-field': 5,
    'area-checkin': 25,
    'step-log': 10,
    'step-done': 20,
  } satisfies Record<AwardKind, number>,

  /** Short "what the points were for" lines, shown with the award. */
  reasons: {
    complaints: 'for telling us what is bugging you',
    name: 'for picking a name',
    baseline: 'for the two-week check-in',
    today: "for today's check-in",
    'profile-field': 'for a detail about you',
    'area-checkin': 'for rating an area',
    'step-log': 'for doing your step',
    'step-done': 'for finishing a step',
  } satisfies Record<AwardKind, string>,

  caps: {
    complaints: { perDay: 1 },
    name: { once: true },
    baseline: { perDay: 1 },
    today: { perDay: 3 },
    'profile-field': { once: true },
    'area-checkin': { perDay: 1, perRef: true },
    'step-log': { perDay: 1, perRef: true },
    'step-done': { once: true },
  } satisfies Record<AwardKind, Cap>,

  /** How many times a step is done before it counts as finished, unless the coach says otherwise. */
  defaultStepTarget: 3,
  /** The most the coach may propose for a first rung. */
  maxStepTarget: 7,
  /**
   * The ladder a finished step can climb: 3 becomes 7 becomes 21. The first rung is
   * a trial; the later rungs are where a habit forms. Each rung is its own step row.
   */
  stepLadder: [3, 7, 21],
  /** The finish bonus per rung (first, second, third and beyond): bigger milestone, bigger response. */
  stepDoneBonusByRung: [20, 40, 80],

  /** Total points needed to reach each level. Level 1 is 0 points. */
  levelThresholds: [0, 30, 80, 150, 250, 400, 600, 850, 1150, 1500],
} as const;
