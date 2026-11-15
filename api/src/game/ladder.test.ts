import { describe, expect, it } from 'vitest';
import { GAME } from '../config/game';
import { finishBonus, nextRungTarget, rungIndex } from './ladder';

describe('step ladder', () => {
  it('climbs 3 to 7 to 21 and stops', () => {
    expect(nextRungTarget(3)).toBe(7);
    expect(nextRungTarget(7)).toBe(21);
    expect(nextRungTarget(21)).toBeNull();
  });
  it('places odd first-rung targets on the ladder sensibly', () => {
    expect(nextRungTarget(1)).toBe(3);
    expect(nextRungTarget(5)).toBe(7);
  });
  it('pays a bigger bonus for a bigger rung', () => {
    expect(finishBonus(3)).toBe(GAME.stepDoneBonusByRung[0]);
    expect(finishBonus(7)).toBe(GAME.stepDoneBonusByRung[1]);
    expect(finishBonus(21)).toBe(GAME.stepDoneBonusByRung[2]);
    expect(finishBonus(1)).toBe(GAME.stepDoneBonusByRung[0]);
    expect(rungIndex(7)).toBe(1);
  });
});
