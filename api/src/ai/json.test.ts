import { describe, expect, it } from 'vitest';
import { parseJsonLoosely } from './json';

describe('parseJsonLoosely', () => {
  it('parses plain JSON', () => {
    expect(parseJsonLoosely('{"reply":"hi","proposedStep":null,"usedNoteIds":[]}')).toEqual({ reply: 'hi', proposedStep: null, usedNoteIds: [] });
  });
  it('strips a code fence', () => {
    expect(parseJsonLoosely('```json\n{"reply":"hi"}\n```')).toEqual({ reply: 'hi' });
  });
  it('skips words before and after the object', () => {
    expect(parseJsonLoosely('Here you go:\n{"reply":"hi"}\nHope that helps.')).toEqual({ reply: 'hi' });
  });
  it('returns undefined for a cut-off reply', () => {
    expect(parseJsonLoosely('{"reply":"I was saying tha')).toBeUndefined();
  });
  it('returns undefined for a bare string', () => {
    expect(parseJsonLoosely('"just text"')).toBeUndefined();
  });
});
