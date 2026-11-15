import { describe, expect, it } from 'vitest';
import { driftsIntoMedicalAdvice } from './safety';

describe('drift detection', () => {
  it('catches dosing and diagnosis', () => {
    expect(driftsIntoMedicalAdvice('Try 5 mg of melatonin before bed')).toBe(true);
    expect(driftsIntoMedicalAdvice('It sounds like you have IBS')).toBe(true);
    expect(driftsIntoMedicalAdvice('You could start a probiotic supplement')).toBe(true);
    expect(driftsIntoMedicalAdvice('I cannot diagnose this')).toBe(true);
  });
  it('lets ordinary habit advice through', () => {
    expect(driftsIntoMedicalAdvice('Try moving your last coffee to before 2pm this week.')).toBe(false);
    expect(driftsIntoMedicalAdvice('Add a handful of veg to dinner three times this week.')).toBe(false);
    expect(driftsIntoMedicalAdvice('Live yoghurt or curd most days is a good start.')).toBe(false);
  });
});
