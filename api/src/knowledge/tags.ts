import type { AreaId } from '@wellbeing/shared';
import type { KnowledgeNote } from '../db/schema';
import { notesForArea, type NoteSeed } from './notes';

export interface RetrievedNote {
  id: string;
  title: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
}

export function presentNote(n: KnowledgeNote | NoteSeed): RetrievedNote {
  return 'source' in n
    ? { id: n.id, title: n.title, body: n.body, sourceName: n.source.name, sourceUrl: n.source.url }
    : { id: n.id, title: n.title, body: n.body, sourceName: n.sourceName, sourceUrl: n.sourceUrl };
}

/**
 * Fallback retrieval with no database and no embedding model: score the seed
 * notes by how many of their tags appear in the query.
 */
export function retrieveByTags(area: AreaId, query: string, k = 5): RetrievedNote[] {
  const q = query.toLowerCase();
  const scored = notesForArea(area).map((n) => ({
    n,
    score: n.tags.reduce((s, tag) => s + (q.includes(tag.toLowerCase()) ? 1 : 0), 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  const hits = scored.filter((s) => s.score > 0).slice(0, k);
  const picked = hits.length > 0 ? hits : scored.slice(0, Math.min(k, 3));
  return picked.map((s) => presentNote(s.n));
}

/** Always available: the safety note for an area, so the coach can point to a professional. */
export function safetyNote(area: AreaId): RetrievedNote | null {
  const n = notesForArea(area).find((x) => x.tags.includes('safety'));
  return n ? presentNote(n) : null;
}
