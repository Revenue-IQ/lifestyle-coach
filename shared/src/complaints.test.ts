import { describe, expect, it } from 'vitest';
import { cardsForRound, COMPLAINTS, flagsFor, litAreas, NOT_SURE_ID, rankAreas, START_ORDER } from './complaints';

describe('where to look first', () => {
  it('gives the primary area two points and the others one', () => {
    const ranked = rankAreas(['r1_stomach']);
    expect(ranked[0]).toMatchObject({ area: 'gut', score: 2 });
    expect(ranked.find((r) => r.area === 'diet')?.score).toBe(1);
    expect(ranked.find((r) => r.area === 'sleep')?.score).toBe(0);
  });
  it('adds up across both rounds and names what lit each area', () => {
    const ranked = rankAreas(['r1_tired', 'r2_phone']);
    expect(ranked[0]).toMatchObject({ area: 'sleep', score: 4 });
    expect(ranked[0].from).toEqual(['Tired all the time', 'On my phone late at night']);
  });
  it('lights nothing for "not sure"', () => {
    expect(litAreas([NOT_SURE_ID])).toEqual([]);
  });
  it('lights at most three areas', () => {
    expect(litAreas(COMPLAINTS.map((c) => c.id)).length).toBeLessThanOrEqual(3);
  });
  it('ignores unknown ids', () => {
    expect(rankAreas(['nonsense']).every((r) => r.score === 0)).toBe(true);
  });
  it('breaks ties in the start order', () => {
    const ranked = rankAreas(['r1_tired']);
    const ones = ranked.filter((r) => r.score === 1).map((r) => r.area);
    expect(ones).toEqual(['diet', 'movement']);
    expect(rankAreas([]).map((r) => r.area)).toEqual(START_ORDER);
  });
  it('points the downtime cards at downtime first, then the levers behind them', () => {
    expect(rankAreas(['r1_worried'])[0].area).toBe('downtime');
    expect(rankAreas(['r1_worried'])[1].area).toBe('sleep');
    expect(rankAreas(['r2_notime'])[0].area).toBe('downtime');
    expect(rankAreas(['r1_dread'])[0].area).toBe('downtime');
  });
  it('still ranks answers stored under the original ids', () => {
    expect(rankAreas(['lonely'])[0].area).toBe('social');
    expect(rankAreas(['low-mood'])[0].area).toBe('social');
  });
  it('offers ten cards in round one, eleven in round two, and hides the old list', () => {
    expect(cardsForRound(1)).toHaveLength(10);
    expect(cardsForRound(2)).toHaveLength(11);
    expect(cardsForRound(1).some((c) => c.id === NOT_SURE_ID || c.hidden)).toBe(false);
  });
  it('raises each flag once', () => {
    expect(flagsFor(['r1_low', 'r1_nofun', 'r1_stomach'])).toEqual(['gut', 'mood']);
    expect(flagsFor(['r2_drink'])).toEqual([]);
  });
});
