# Knowledge base

Status: built in Phase 3; 59 notes embedded locally on 2026-11-14, 14 Downtime notes added 2026-11-15 and not yet loaded · Last updated: 2026-11-15

## What this covers

The app's own guidance notes, how they are stored and embedded, and how the coach retrieves them. This is the guardrail the Buildathon asks for: the coach advises from these notes, not from the model's general knowledge.

## The notes

`api/src/knowledge/notes.ts` holds every note as content: an id, the area, a title, a body of two to four sentences in our own words, the public source it was drawn from (name and URL), and tags. On 2026-11-15 there are 73 notes: 22 for Food, 11 for Sleep, 8 for Movement, 9 for Gut health, 9 for Social belonging, 14 for Downtime. The Downtime notes (work cutoffs, real breaks, a buffer between work and home, fifteen protected minutes, a breathing exercise with steps, a script for pushing back, something to look forward to midweek, unwinding without the drink, caregiving, on-call recovery, and when stress is more than a busy patch) were written from NHS, APA, NIOSH, Mind, Mayo Clinic, Sleep Foundation and Family Caregiver Alliance pages. The owner chose on 2026-11-15 to load them for the buildathon demo without a line-by-line review; run `npm run kb:load -w api` locally and the "load knowledge notes" workflow on the server to embed them. Until then the tag fallback serves them. Every area has a note tagged `safety` that says when to see a professional; it is always included in retrieval.

Sources used: NHS Eat well, the WHO healthy diet fact sheet, British Dietetic Association food facts and fibre sheet, NHS sleep and tiredness, Sleep Foundation sleep hygiene, CDC and WHO physical activity guidance, NHS digestive health, the US Surgeon General's advisory on loneliness, Campaign to End Loneliness, and Mind on loneliness.

Tests (`notes.test.ts`) enforce unique ids, a source and a body on every note, at least eight notes and a safety note per area, and no dosing language anywhere.

**The owner reviews every note before the demo.** Nothing in the file is medical advice; anything that touches a condition points to a professional. Edits go in the file and are loaded with the script below.

## Storage and embeddings

Table `knowledge_notes` in the same Postgres database, with a `vector(768)` column and an HNSW cosine index, through pgvector (installed with Homebrew on the owner's Mac, `CREATE EXTENSION vector`; the Docker image `pgvector/pgvector:pg17` has it built in).

`npm run kb:load -w api` embeds each note's title and body with the configured embedding model, prefixed with `document:` because the model has no task type setting, and upserts it. Unchanged notes are skipped; notes removed from the file are deleted. It needs `GEMINI_API_KEY`.

## Retrieval

`retrieveNotes(area, query)` in `api/src/knowledge/retrieve.ts` embeds the query with the `query:` prefix and returns the five closest notes in that area by cosine similarity. The query is the area name, the person's gaps, their complaints and their latest message.

When no key is configured, or the table has not been loaded, retrieval falls back to tag overlap against the seed file (`tags.ts`), so the coach always has something to stand on and the demo cannot be left with an empty prompt. Tags are plain phrases that match the questionnaire gap wording for exactly this reason.

## Decisions

- **Notes are the only source for advice** — the prompt says so, the retrieved set is the only thing the model sees, and ids outside it are discarded. Hard limits still live in code (`docs/features/coach.md`), because a prompt is guidance, not a guarantee.
- **Short notes, many of them** — a note is one idea with one source, so retrieval returns the right handful and the coach can cite them. Long articles would retrieve badly and be hard to review.
- **Tag fallback kept on purpose** — it costs nothing, it makes the coach testable without a key, and it is a safety net if the embedding model changes or the table is empty.
- **Safety note always included** — the model always has the "when to see someone" guidance for the area in front of it.
- **Embedding size 768, cosine, HNSW** — as the tech-stack doc decided: under pgvector's indexed-column limit and one of the model's recommended sizes.

## Future

- Notes for food items when log-based diet ratings arrive.
- A small admin page to read, edit and reload notes without touching the file.
- Record which notes each reply used over time, to see which are pulling their weight.
