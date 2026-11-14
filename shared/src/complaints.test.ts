import { describe, expect, it } from 'vitest';
import { COMPLAINTS, litAreas, NOT_SURE_ID, rankAreas } from './complaints';

describe('where to look first', () => {
  it('gives the primary area two points and the others one', () => {
    const ranked = rankAreas(['bloated']);
    expect(ranked[0]).toMatchObject({ area: 'gut', score: 2 });
    expect(ranked.find((r) => r.area === 'diet')?.score).toBe(1);
    expect(ranked.find((r) => r.area === 'sleep')?.score).toBe(0);
  });
  it('adds up across complaints and names what lit each area', () => {
    const ranked = rankAreas(['tired-all-the-time', 'wake-up-tired']);
    expect(ranked[0]).toMatchObject({ area: 'sleep', score: 4 });
    expect(ranked[0].from).toEqual(['Tired all the time', 'Wake up tired']);
    expect(ranked[1]).toMatchObject({ area: 'diet', score: 2 });
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
  it('breaks ties in display order', () => {
    const ranked = rankAreas(['tired-all-the-time']);
    const ones = ranked.filter((r) => r.score === 1).map((r) => r.area);
    expect(ones).toEqual(['diet', 'movement']);
  });
  it('points loneliness and low mood at social belonging', () => {
    expect(rankAreas(['lonely'])[0].area).toBe('social');
    expect(rankAreas(['low-mood'])[0].area).toBe('social');
  });
});
