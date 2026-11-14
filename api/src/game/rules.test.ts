import { describe, expect, it } from 'vitest';
import { GAME } from '../config/game';
import { decideAward, levelFor, pointsToNextLevel } from './rules';

describe('levels', () => {
  it('starts at level 1 with no points', () => {
    expect(levelFor(0)).toBe(1);
  });
  it('reaches level 2 at the second threshold', () => {
    expect(levelFor(GAME.levelThresholds[1] - 1)).toBe(1);
    expect(levelFor(GAME.levelThresholds[1])).toBe(2);
  });
  it('says what the next level needs', () => {
    expect(pointsToNextLevel(0)).toEqual({ nextLevel: 2, needed: GAME.levelThresholds[1] });
  });
  it('has no next level at the top', () => {
    expect(pointsToNextLevel(GAME.levelThresholds.at(-1)!)).toBeNull();
  });
  it('never goes down as points grow', () => {
    let last = 0;
    for (let total = 0; total <= 2000; total += 7) {
      const level = levelFor(total);
      expect(level).toBeGreaterThanOrEqual(last);
      last = level;
    }
  });
});

describe('awards', () => {
  it('pays the configured points for a first contribution', () => {
    expect(decideAward('today', 0)).toEqual({ points: GAME.points.today, reason: GAME.reasons.today, capped: false });
  });
  it('caps repeated entries within a day but keeps the reason', () => {
    const d = decideAward('today', GAME.caps.today.perDay);
    expect(d.points).toBe(0);
    expect(d.capped).toBe(true);
    expect(d.reason).toBe(GAME.reasons.today);
  });
  it('pays once-only kinds exactly once', () => {
    expect(decideAward('name', 0).points).toBe(GAME.points.name);
    expect(decideAward('name', 1).capped).toBe(true);
  });
  it('never pays a negative amount', () => {
    for (const kind of Object.keys(GAME.points) as (keyof typeof GAME.points)[]) {
      for (let n = 0; n < 5; n++) expect(decideAward(kind, n).points).toBeGreaterThanOrEqual(0);
    }
  });
});
