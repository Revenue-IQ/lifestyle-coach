/**
 * The one place for every game number. See the gamification skill.
 * Points reward the act of adding information, whatever it says.
 * Nothing here ever makes a total go down.
 */
export const AWARD_KINDS = ['complaints', 'name', 'baseline', 'today', 'profile-field'] as const;
export type AwardKind = (typeof AWARD_KINDS)[number];

export const GAME = {
  /** Points for one contribution of each kind. */
  points: {
    complaints: 20,
    name: 10,
    baseline: 30,
    today: 5,
    'profile-field': 5,
  } satisfies Record<AwardKind, number>,

  /** Short "what the points were for" lines, shown with the award. */
  reasons: {
    complaints: 'for telling us what is bugging you',
    name: 'for picking a name',
    baseline: 'for the two-week check-in',
    today: "for today's check-in",
    'profile-field': 'for a detail about you',
  } satisfies Record<AwardKind, string>,

  /**
   * How many contributions of a kind earn points per calendar day (UTC).
   * Entries beyond the cap are still stored, they just earn nothing that day.
   * `once` means once ever (per reference, for profile fields).
   */
  caps: {
    complaints: { perDay: 1 },
    name: { once: true },
    baseline: { perDay: 1 },
    today: { perDay: 3 },
    'profile-field': { once: true },
  } satisfies Record<AwardKind, { perDay: number } | { once: true }>,

  /** Total points needed to reach each level. Level 1 is 0 points. */
  levelThresholds: [0, 30, 80, 150, 250, 400, 600, 850, 1150, 1500],
} as const;
