import { describe, expect, it } from 'vitest';
import { AREAS } from './areas';
import { areaBand, cleanAnswers, QUESTIONNAIRES, rateArea } from './questionnaires';

describe('questionnaire content', () => {
  it('has five to seven questions per area, each with a reason and scored options', () => {
    for (const area of AREAS) {
      const q = QUESTIONNAIRES[area];
      expect(q.area).toBe(area);
      expect(q.questions.length).toBeGreaterThanOrEqual(5);
      expect(q.questions.length).toBeLessThanOrEqual(7);
      for (const question of q.questions) {
        expect(question.why.length).toBeGreaterThan(10);
        expect(question.options.length).toBeGreaterThanOrEqual(3);
        expect(question.options.some((o) => o.score === 3 || o.score === 2)).toBe(true);
        expect(question.options.some((o) => o.score === 0)).toBe(true);
        for (const o of question.options) {
          if (o.score <= 1) expect(o.gap, `${area}.${question.id}.${o.value} needs a gap`).toBeTruthy();
          if (o.score === 3) expect(o.gap).toBeUndefined();
        }
      }
    }
  });
  it('has unique question ids and option values within each area', () => {
    for (const area of AREAS) {
      const ids = QUESTIONNAIRES[area].questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const q of QUESTIONNAIRES[area].questions) {
        const values = q.options.map((o) => o.value);
        expect(new Set(values).size).toBe(values.length);
      }
    }
  });
});

describe('rating', () => {
  const best = (area: (typeof AREAS)[number]) =>
    Object.fromEntries(
      QUESTIONNAIRES[area].questions.map((q) => [q.id, [...q.options].sort((a, b) => b.score - a.score)[0].value]),
    );
  const worst = (area: (typeof AREAS)[number]) =>
    Object.fromEntries(
      QUESTIONNAIRES[area].questions.map((q) => [q.id, [...q.options].sort((a, b) => a.score - b.score)[0].value]),
    );

  it('scores all-best answers near 100 and all-worst at 0', () => {
    for (const area of AREAS) {
      expect(rateArea(area, best(area)).score).toBeGreaterThanOrEqual(89);
      const w = rateArea(area, worst(area));
      expect(w.score).toBe(0);
      expect(w.band).toBe('attention');
      expect(w.gaps.length).toBe(QUESTIONNAIRES[area].questions.length);
    }
  });
  it('rates only the answered questions and marks few answers as rough', () => {
    const r = rateArea('sleep', { hours: '7-9', screens: 'fall-asleep-to-it' });
    expect(r.answered).toBe(2);
    expect(r.score).toBe(50);
    expect(r.rough).toBe(true);
    expect(r.gaps).toEqual(['falling asleep to a screen']);
  });
  it('returns a null score when nothing is answered', () => {
    const r = rateArea('diet', {});
    expect(r.score).toBeNull();
    expect(r.band).toBeNull();
  });
  it('uses the band thresholds', () => {
    expect(areaBand(44)).toBe('attention');
    expect(areaBand(45)).toBe('could-be-better');
    expect(areaBand(69)).toBe('could-be-better');
    expect(areaBand(70)).toBe('solid');
  });
  it('drops unknown questions and values', () => {
    expect(cleanAnswers('gut', { bloating: 'rarely', nonsense: 'x', reflux: 'made-up' })).toEqual({ bloating: 'rarely' });
  });
});
