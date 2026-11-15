# Coach

Status: built in Phase 3 (web), live replies verified on 2026-11-14 · Last updated: 2026-11-14

## What it does

Each life area has a coach. It opens from the area page, speaks first, and its first message is built from the person's rating and gaps: "Sleep came out at 22, mostly from late caffeine and broken nights. Which feels easier to move first?" There is no empty chat box to stare at.

The person can reply in their own words. The coach knows everything the app already knows (complaints, baseline score, profile, the area's answers, steps already tried) and never asks for it again. It stays inside its area and points to another area if the conversation wanders. When it proposes a small step, one tap on "Make it my step" turns it into a counted quest (see `docs/features/steps.md`). Every coach message shows the sources it drew on.

## How it works

**Where the code is.** `api/src/coach/` (prompt and context pack, safety rules, the service that runs retrieval, the model and the output checks), `api/src/routes/coach.ts` (routes and the gates), `api/src/ai/gemini.ts` (the only file that talks to Gemini), `mobile/app/areas/[area]/coach.tsx` (the screen).

**Routes.** `POST /api/areas/:area/coach` opens or resumes the one active conversation for that area, or starts over when asked. It returns `gates` when something must be answered first, `under18` when the person said they are under 18, or `open` with the messages. `POST /api/coach/:id/messages` sends a message and returns the whole conversation. `POST /api/coach/:id/steps` accepts the step a given coach message proposed.

**The context pack** (`buildContext`): name, area rating with band and gaps, complaints and free text, WHO-5 score, profile, conditions, pregnancy flag, active and finished steps in the area. It goes into the system prompt as plain lines, so the coach can reflect it back instead of asking.

**Retrieval.** The query is the area name, the gaps, the complaints and the latest message. The five closest notes in that area come from the knowledge base (`docs/architecture/knowledge-base.md`), plus the area's safety note always. The prompt tells the model to advise only from those notes and to list the ids it used; ids that were not in the retrieved set are dropped from the stored message.

**The model call.** One request per reply, asking for JSON with `reply`, `proposedStep` (or null) and `usedNoteIds`, with thinking set low so the person is not kept waiting. Model names come from configuration (`GEMINI_TEXT_MODEL`, `GEMINI_TEXT_FALLBACK_MODELS`, `GEMINI_EMBEDDING_MODEL`) and nowhere else. Without a key the routes answer 503 and the app shows "Not switched on yet".

**A chain of models, with a timeout.** Each request has a timeout (`GEMINI_TIMEOUT_MS`, 15 seconds by default). If the configured model times out or reports high demand, the next model in the fallback list is tried (default chain since 2026-11-14: `gemini-3.5-flash-lite` first, then `gemini-3.1-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`, because the lite models have a much larger free daily allowance), and a model that just failed is skipped for five minutes. A model that reports its free daily quota is spent is skipped until Google's own retry time. If every model fails, the person sees "the coach is busy, give it a minute", or, when every model is out of daily quota, that today's free allowance is used up and roughly when it comes back. Nothing they typed is lost, and the screen offers "Try again". This was added after the first live test on 2026-11-14, when `gemini-3.8-flash` hung for minutes and returned "high demand" while `gemini-3.5-flash` answered in under a second.

**Opening safely.** The opening message is generated before the conversation row is written, so a failed model call leaves nothing behind. An active conversation found with no messages is treated as new.

**Network failures (fixed 2026-11-14).** A connect timeout on one of Google's IPv6 addresses made the coach fail with a 500, because the failure happened in the embedding call for retrieval, outside the model chain. Now: the API prefers IPv4 for outbound calls; a failed embedding falls back to tag retrieval with a warning instead of stopping the reply; a failure to reach Google at all counts as transient and moves to the next model; and anything unexpected in the coach routes becomes a 503 with a plain "try again in a moment" rather than a bare error.

**Rules enforced in code, whatever the model says** (`api/src/coach/safety.ts`, tested):

- Gates before the first session: "Are you 18 or over?" for every area, "Pregnant or breastfeeding?" for Diet, and an optional "anything the coach should know" line. Stored on the profile, asked once. Under 18 means no coach, with a plain message pointing to a doctor, school nurse or trusted adult.
- Crisis language in a message (self-harm, suicide, not wanting to be here) means no model call: a plain message with professional resources is stored as a notice, and the coach steps back.
- **The coach stays stepped back for a day after a crisis notice (added 2026-11-14).** Notices are stored with a kind; if a crisis notice was shown to this person within the last 24 hours, in any area, the prompt switches to a gentle mode (ask how they are, no ratings, no steps) and the code drops any proposed step regardless. Verified live: a follow-up "what else can I do about my sleep" got a short, warm reply pointing to help and asking how they were, with no step.
- **The two inputs outside the chat are checked too (added 2026-11-14).** The free text on "What's bugging you" and the "anything the coach should know" line were never crisis-checked. Now the detector lives in `shared/src/safety.ts`, used by both sides: the pre-login result screen shows a plain notice before the card if the free text matches; the API returns a notice from those two writes; and the home data carries a `safetyNotice` while the stored words still match, shown at the top of home. The coach is also told, in a gentler form, when those stored words carried distress.
- A reply that drifts into dosing, naming a condition the person "probably has", suggesting medicines or supplements, or diagnosing is replaced with a fallback that says so and offers to pick a habit instead.
- One active step per area: a proposed step is dropped in code when one is already active, even if the model proposes one.
- Pregnancy or breastfeeding adds a standing instruction to keep Diet advice general and to point to the midwife or doctor.

**No points for chatting.** Points come from logging steps, so there is no reason to talk to the coach for points, and the screen says so.

## Decisions

- **The coach speaks first, from the rating** — an empty chat box is where this audience gives up. The opening instruction tells the model to reflect the rating and gaps back and ask one question, and not to propose a step yet.
- **A coach per area, not one general assistant** — the rating supplies the opening, retrieval is restricted to that area's notes, and the prompt refuses other topics. This is what keeps it from being a general chatbot, which the owner was rightly worried about.
- **The conversation has an end state** — it is over when a step has been agreed. The prompt stops the coach proposing further steps once one is active, and the code enforces it.
- **Structured output rather than parsing prose** — the step comes back as a typed object, so the code, not a regex, turns it into a quest.
- **A recommendation always carries a step (fixed 2026-11-14)** — in a real conversation the coach recommended curd daily and never filled the step object, because an earlier proposal had been ignored and the prompt said "never two in a row". Three changes: the prompt now says that whenever the reply recommends one specific thing, or the person agrees to one, or asks to track it, `proposedStep` must be filled; the context lists proposals from this conversation that were not taken up, so the model knows they were declined rather than pending; and an explicit ask such as "add a step" or "you won't add a step" is recognised in code (`api/src/coach/intent.ts`, tested) and a note is appended to the model's copy of that turn. Verified live: the fermented-food recommendation came with a step, and "can you add a step for it" re-proposed the curd version.
- **The person's message is stored only once a reply exists (fixed 2026-11-14)** — it used to be saved before the model call, so a failed call left it in the history and a retry stored it again; one conversation had the same message three times in a row. Now the reply is produced first and both rows are written together.
- **Safety in code as well as in the prompt** — the prompt is strong guidance, not a guarantee. Crisis detection, drift detection, gates and the one-step rule run regardless of the model's output. No humour anywhere in those messages.
- **Sources shown on every message** — the ids the model says it used are filtered to the retrieved set, then shown as links. If the model used nothing, nothing is shown.
- **Plain HTTP to Gemini, no SDK** — one small file, easy to swap provider or tier, and nothing else in the backend knows which model is in use.
- **Free tier only for the demo** — a conversation about loneliness is deeply personal. Before any real person types into this, the AI must move to a paid tier or another provider, as `docs/architecture/tech-stack.md` records.

**Verified live on 2026-11-14:** the opening reflected the Sleep rating and named two gaps with two sources; a reply about the phone in bed produced "Charge your phone across the room" as a step; accepting it twice was refused; logging it earned 10 points and a second log the same day earned nothing; a message with crisis language got the plain notice with no model call.

## Future

- Tune the opening instruction and the step wording after a few more real conversations.
- Rate limiting per person, before anyone outside the demo uses it.
- Let the coach see the person's recent "today" check-ins and step logs, so it can notice a pattern.
- Native keyboard handling on the chat screen when the mobile phase starts.
