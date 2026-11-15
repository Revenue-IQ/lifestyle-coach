import { AREAS } from '@wellbeing/shared';
import { describe, expect, it } from 'vitest';
import { NOTES, notesForArea } from './notes';
import { retrieveByTags, safetyNote } from './tags';

describe('knowledge notes', () => {
  it('has unique ids and a source on every note', () => {
    const ids = NOTES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of NOTES) {
      expect(n.source.name.length).toBeGreaterThan(3);
      expect(n.source.url.startsWith('https://')).toBe(true);
      expect(n.body.length).toBeGreaterThan(80);
      expect(n.tags.length).toBeGreaterThan(0);
    }
  });
  it('covers every area with at least eight notes and a safety note', () => {
    for (const area of AREAS) {
      expect(notesForArea(area).length).toBeGreaterThanOrEqual(8);
      expect(safetyNote(area)).not.toBeNull();
    }
  });
  it('never uses dosing language', () => {
    for (const n of NOTES) expect(n.body).not.toMatch(/\b\d+\s?mg\b/i);
  });
});

describe('tag retrieval fallback', () => {
  it('finds the caffeine note for a late-caffeine gap', () => {
    const hits = retrieveByTags('sleep', 'gaps: caffeine late in the day; broken nights');
    expect(hits.map((h) => h.id)).toContain('sleep-caffeine-cutoff');
  });
  it('returns something even when nothing matches', () => {
    expect(retrieveByTags('gut', 'zzz').length).toBeGreaterThan(0);
  });
});
