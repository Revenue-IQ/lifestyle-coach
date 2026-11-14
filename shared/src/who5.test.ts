import { describe, expect, it } from 'vitest';
import { isValidWho5Answers, scoreWho5, who5Band } from './who5';

describe('WHO-5 scoring', () => {
  it('multiplies the raw total by four', () => {
    expect(scoreWho5([0, 0, 0, 0, 0])).toBe(0);
    expect(scoreWho5([5, 5, 5, 5, 5])).toBe(100);
    expect(scoreWho5([3, 2, 4, 1, 5])).toBe(60);
  });
  it('rejects anything but five answers from 0 to 5', () => {
    expect(isValidWho5Answers([1, 2, 3, 4])).toBe(false);
    expect(isValidWho5Answers([1, 2, 3, 4, 6])).toBe(false);
    expect(isValidWho5Answers([1, 2, 3, 4, 2.5])).toBe(false);
    expect(isValidWho5Answers([1, 2, 3, 4, 5])).toBe(true);
  });
  it('uses the published cut-offs', () => {
    expect(who5Band(28)).toBe('professional');
    expect(who5Band(29)).toBe('low');
    expect(who5Band(50)).toBe('low');
    expect(who5Band(51)).toBe('ok');
  });
});
