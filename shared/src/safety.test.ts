import { describe, expect, it } from 'vitest';
import { looksLikeCrisis } from './safety';

describe('crisis detection', () => {
  it('catches the obvious phrases', () => {
    expect(looksLikeCrisis("I don't want to be here any more")).toBe(true);
    expect(looksLikeCrisis('sometimes I think about killing myself')).toBe(true);
    expect(looksLikeCrisis('I have been self-harming')).toBe(true);
    expect(looksLikeCrisis('life is not worth living')).toBe(true);
  });
  it('does not fire on everyday tiredness', () => {
    expect(looksLikeCrisis('I am so tired I could die of boredom at work')).toBe(false);
    expect(looksLikeCrisis('I want to sleep better')).toBe(false);
    expect(looksLikeCrisis('this diet is killing me lol')).toBe(false);
    expect(looksLikeCrisis(null)).toBe(false);
    expect(looksLikeCrisis('')).toBe(false);
  });
});
