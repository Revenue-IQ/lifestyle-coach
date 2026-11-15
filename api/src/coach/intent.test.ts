import { describe, expect, it } from 'vitest';
import { wantsStep } from './intent';

describe('wants a step', () => {
  it('recognises explicit asks', () => {
    expect(wantsStep("You won't add a step for it")).toBe(true);
    expect(wantsStep('can you add that as a step?')).toBe(true);
    expect(wantsStep('make it my step')).toBe(true);
    expect(wantsStep('ok track this please')).toBe(true);
  });
  it('ignores ordinary messages', () => {
    expect(wantsStep('Yes. I like curd')).toBe(false);
    expect(wantsStep('what else can I do?')).toBe(false);
    expect(wantsStep('one step at a time I suppose')).toBe(false);
  });
});
