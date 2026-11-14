import { GAME, type AwardKind } from '../config/game';

/** Level for a total: the number of thresholds reached. Never below 1. */
export function levelFor(total: number): number {
  let level = 0;
  for (const t of GAME.levelThresholds) {
    if (total >= t) level += 1;
    else break;
  }
  return Math.max(level, 1);
}

/** Points still needed for the next level, or null at the top level. */
export function pointsToNextLevel(total: number): { nextLevel: number; needed: number } | null {
  const level = levelFor(total);
  const next = GAME.levelThresholds[level];
  if (next === undefined) return null;
  return { nextLevel: level + 1, needed: next - total };
}

export interface AwardDecision {
  points: number;
  reason: string;
  /** True when the entry is stored but earns nothing because of a cap. */
  capped: boolean;
}

/**
 * Decides what a contribution earns, given how many of its kind already earned
 * points today (or ever, for once-only kinds). Pure, so it is easy to test.
 */
export function decideAward(kind: AwardKind, alreadyAwarded: number): AwardDecision {
  const cap = GAME.caps[kind];
  const limit = 'once' in cap ? 1 : cap.perDay;
  if (alreadyAwarded >= limit) {
    return { points: 0, reason: GAME.reasons[kind], capped: true };
  }
  return { points: GAME.points[kind], reason: GAME.reasons[kind], capped: false };
}

/** Start of the current UTC day, for per-day caps. */
export function startOfUtcDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
