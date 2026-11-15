import type { AreaId } from '@wellbeing/shared';
import { and, cosineDistance, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { aiEnabled, embed } from '../ai/gemini';
import { db } from '../db/client';
import { knowledgeNotes } from '../db/schema';
import { presentNote, retrieveByTags, type RetrievedNote } from './tags';

export { retrieveByTags, safetyNote, type RetrievedNote } from './tags';

/**
 * The closest notes in one area for a query such as the person's gaps plus
 * their latest message. Vector search when embeddings exist; tag overlap
 * against the seed file otherwise, so the coach still has something to stand on.
 */
export async function retrieveNotes(area: AreaId, query: string, k = 5): Promise<RetrievedNote[]> {
  if (aiEnabled()) {
    const [loaded] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(knowledgeNotes)
      .where(and(eq(knowledgeNotes.area, area), isNotNull(knowledgeNotes.embedding)));
    if ((loaded?.n ?? 0) > 0) {
      try {
        const vec = await embed(query, 'query');
        const similarity = sql<number>`1 - (${cosineDistance(knowledgeNotes.embedding, vec)})`;
        const rows = await db
          .select({ note: knowledgeNotes, similarity })
          .from(knowledgeNotes)
          .where(and(eq(knowledgeNotes.area, area), isNotNull(knowledgeNotes.embedding)))
          .orderBy(desc(similarity))
          .limit(k);
        return rows.map((r) => presentNote(r.note));
      } catch (err) {
        // A failed embedding call (network, quota) must not stop the coach: tags still ground it.
        console.warn(`[retrieve] embedding failed, using tags (${(err as Error).message.slice(0, 120)})`);
      }
    }
  }
  return retrieveByTags(area, query, k);
}
