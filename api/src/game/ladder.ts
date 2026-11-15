import { GAME } from '../config/game';

/** The target after `current` on the ladder, or null at the top. */
export function nextRungTarget(current: number): number | null {
  for (const rung of GAME.stepLadder) if (rung > current) return rung;
  return null;
}

/** Which rung a step is on, 0-based, judged by its target. Anything below the second rung is rung 0. */
export function rungIndex(target: number): number {
  let idx = 0;
  GAME.stepLadder.forEach((rung, i) => {
    if (target >= rung) idx = i;
  });
  return idx;
}

/** The finish bonus for a step with this target. */
export function finishBonus(target: number): number {
  const bonuses = GAME.stepDoneBonusByRung;
  return bonuses[Math.min(rungIndex(target), bonuses.length - 1)];
}
