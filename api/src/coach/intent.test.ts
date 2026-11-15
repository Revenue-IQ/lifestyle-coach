import { describe, expect, it } from 'vitest';
import { wantsStep, wantsSwap } from './intent';

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

describe('wants to swap the step', () => {
  it('recognises asks to replace or drop it', () => {
    expect(wantsSwap('remove the step and suggest a new one')).toBe(true);
    expect(wantsSwap('can I swap this step for something easier')).toBe(true);
    expect(wantsSwap('drop my step please')).toBe(true);
    expect(wantsSwap('give me a different step')).toBe(true);
    expect(wantsSwap("I don't want this step")).toBe(true);
  });
  it('ignores ordinary messages', () => {
    expect(wantsSwap('how is my step going')).toBe(false);
    expect(wantsSwap('I did the step twice today')).toBe(false);
    expect(wantsSwap('one step at a time')).toBe(false);
  });
});

describe('a direct ask for the step', () => {
  it('counts as wanting a step', () => {
    expect(wantsStep('What should I try?')).toBe(true);
    expect(wantsStep("Ok what's my step?")).toBe(true);
    expect(wantsStep("What's one thing I can change?")).toBe(true);
    expect(wantsStep('So what should I do?')).toBe(true);
  });
});
