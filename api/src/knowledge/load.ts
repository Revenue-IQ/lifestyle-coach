/**
 * Loads the knowledge notes into Postgres with their embeddings.
 * Run with: npm run kb:load -w api
 * Re-running updates changed notes and re-embeds them. Needs GEMINI_API_KEY.
 */
import { eq } from 'drizzle-orm';
import { aiEnabled, embed } from '../ai/gemini';
import { db } from '../db/client';
import { knowledgeNotes } from '../db/schema';
import { NOTES } from './notes';

async function main() {
  if (!aiEnabled()) {
    console.error('GEMINI_API_KEY is not set; notes cannot be embedded. Retrieval will use tags until they are.');
    process.exit(1);
  }
  const existing = new Map(
    (await db.select({ id: knowledgeNotes.id, body: knowledgeNotes.body, title: knowledgeNotes.title }).from(knowledgeNotes)).map(
      (r) => [r.id, r],
    ),
  );
  let embedded = 0;
  let unchanged = 0;
  for (const note of NOTES) {
    const prev = existing.get(note.id);
    if (prev && prev.body === note.body && prev.title === note.title) {
      unchanged += 1;
      continue;
    }
    const vector = await embed(`${note.title}. ${note.body}`, 'document');
    const row = {
      area: note.area,
      title: note.title,
      body: note.body,
      sourceName: note.source.name,
      sourceUrl: note.source.url,
      tags: note.tags,
      embedding: vector,
      updatedAt: new Date(),
    };
    await db
      .insert(knowledgeNotes)
      .values({ id: note.id, ...row })
      .onConflictDoUpdate({ target: knowledgeNotes.id, set: row });
    embedded += 1;
    process.stdout.write(`embedded ${note.id}\n`);
  }
  const seedIds = new Set(NOTES.map((n) => n.id));
  let removed = 0;
  for (const id of existing.keys()) {
    if (!seedIds.has(id)) {
      await db.delete(knowledgeNotes).where(eq(knowledgeNotes.id, id));
      removed += 1;
    }
  }
  console.log(`done: ${embedded} embedded, ${unchanged} unchanged, ${removed} removed, ${NOTES.length} notes in total`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
