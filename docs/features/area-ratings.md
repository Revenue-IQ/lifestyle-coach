# Area ratings

Status: built in Phase 2 (web) · Last updated: 2026-11-15

## What it does

Each of the five life areas (Sleep, Diet, Movement, Gut health, Social belonging) can be rated by answering a short "how it usually is" questionnaire: five to seven questions about a normal week, each with its reason on screen, each skippable. The answers give a rating out of 100, a band (needs attention, could be better, solid) and the gaps in plain words: "Sleep is 22, mostly from under seven hours and caffeine late in the day."

The home screen is the person's picture so far. The areas sit in two groups: **Worth a look** (anything the complaints point at, and anything rated below solid), weakest first, then **Everything else**. An unrated area that the complaints flagged says why in one line, "From: low mood, anxious or wound up", until it is rated, when its gaps take over. Every rating is a dated snapshot, so redoing the questionnaire later shows the number moving.

## How it works

**Content** is in `shared/src/questionnaires.ts`, meant to be read and tuned by a person. Every answer carries a score from 0 to 3. Low answers carry a `gap` phrase. The file has tests that enforce the shape: five to seven questions per area, a reason on each, a 0-score and a top-score option on each, and a gap on every answer scoring 0 or 1.

**Scoring** (`rateArea` in the same file, tested): the rating is the share of points earned across the questions that were answered, times 100. Skipped questions do not count against anyone. Fewer than three answers marks the rating as rough. Bands: below 45 needs attention, below 70 could be better, 70 and up solid.

**Storage and API:** `POST /api/areas/:area/checkins` stores the answers, the computed score, the number answered and the gaps in `area_checkins`, so history stays stable if the content is tuned later. `GET /api/areas` and the home data (`/api/me`) return every area with its latest rating, its complaint signal (the weight and the complaints behind it, from the same map the first screen uses) and its section, already in display order: rated areas weakest first, then unrated flagged areas strongest signal first, then the rest. The backend decides the grouping so web and mobile agree (`areaStandings` in `api/src/routes/areas.ts`). `GET /api/areas/:area` returns that area's history.

**Points:** 25 per questionnaire, capped at one earning per area per calendar day. Rating two areas in one day earns twice; rating the same one twice does not. The cap type gained a `perRef` flag for this (`api/src/config/game.ts`).

**Screens:** `mobile/app/areas/[area]/index.tsx` (the area page: rating, gaps, history, "Rate it again") and `mobile/app/areas/[area]/rate.tsx` (one question per step, Skip at full size beside Back, the result with the gaps). The ranked list is on the home screen.

**The areas changed in this phase.** Emotions was replaced by Social belonging. The four other areas are levers, things a person does; emotions are an outcome, and the WHO-5 baseline already measures the outcome. Loneliness is a lever with concrete steps and sits quietly behind a lot of "stuck". The complaint map was redrawn for it, and a "Mostly on my own" complaint was added. See `docs/features/whats-bugging-you.md`.

**Home layout (owner review, 2026-11-15).** Under the greeting sits one row of small pills: "Right now" (today's mood and energy), "Two weeks" (the WHO-5 score once taken, or its points before), and the one-time quests "Name" and "About you", which disappear once done. That row replaced three full sections (Two-week wellbeing, Quick add, Small quests) so the steps and the areas, the actual picture, sit above the fold. Unrated areas say "Not rated yet" with no points: next to a real score of 22, "Rate it · +25" read like a number, so the payoff is shown only on the area page's rate button. The one exception to the row is a person who picked "feeling low" with no two-week score yet: the full two-week card with its reason still comes first, because that one is a safety nudge rather than a quest.

**Home link, not Back home (2026-11-15).** Every signed-in page has a small "Home" link in the top right, from the page shell (`Screen`'s `home` prop); the "Back home" buttons at the bottom of the area, rating and baseline pages are gone. The coach screen keeps its own header and puts the link next to "Start over".

## Decisions

- **"Diet" is shown as "Food" (2026-11-15)** — the teammate's card list used Food and it reads less like a regime. The area id stays `diet` everywhere in code and data.

- **Self-reported questionnaire ratings now, log-based ratings later** — a log-based rating (meals through the AI model, nights of sleep) takes weeks of entries before it says anything, and a stuck person gives up long before that. A questionnaire gives a real, explainable rating in a minute. The app says the rating is "as you described a normal week" so the limitation is honest. Log-based ratings remain planned and will replace the questionnaire number once there is enough data.
- **Rate only what was answered** — penalising skipped questions would make Skip cost something, which the asking-for-input rules forbid. Instead the rating is marked rough under three answers and the screen says a few more would firm it up.
- **Gaps are phrases on answers, not a separate rules engine** — each low answer names its own gap in the content file, so the explanation of a rating is always literally the answers given. Simple to review and impossible to get out of sync.
- **Score and gaps stored at write time** — the content will be tuned. Storing the computed result keeps a person's history meaning what it meant when they answered.
- **One list that merges both signals, in two groups (changed 2026-11-14)** — the first version showed a separate "where to look first" card above a ranked list, which made the person join the two up themselves. The owner asked for the complaint signal to filter the areas instead, so the card went and each area carries its own "From:" line. "Worth a look" rather than "affected areas", because the complaint map is a guess about where to look, not a finding. A "start here" tag marks the first area only when it is rated needs-attention. A brand-new person with nothing flagged sees one plain list; someone with everything solid sees a kind line instead of an empty group.
- **Home is the picture, not a section called "picture"** — steps to do first, then the two area groups, then the two-week score as the scoreboard row, then quick add and quests. The About you card became a quest row only, since it already was one.
- **The same points whatever the answers** — a rating of 22 earns the same 25 points as a rating of 90. Honesty is what the app runs on.
- **Band thresholds and points live in config** — 45 and 70 are first guesses, set in one place, like every other game number.

## Downtime (added 2026-11-15)

A sixth area, from the teammates' buildathon material: rest, boundaries and time of your own. Seven questions in `shared/src/questionnaires.ts`: when work actually stops, time that is yours, real breaks, the first thing in the morning, how you unwind, something to look forward to, and whether you can push back at work. Scored like the others. The cards "Stressed or worried a lot", "Dread going to work", "Work never really stops", "No time for myself", "I live for the weekend" and "A drink helps me relax" now point at Downtime first, with sleep, movement or social as their second areas, so the "where to look first" card can light it. Downtime sits second in the start order, after Sleep. Its coach is told never to suggest quitting, confronting anyone or ignoring a pager, and to respect constraints like a visa, children, caregiving or being on call.

## Future

- **Downtime as a sixth area** (stress, work pressure, time for oneself): the first-screen cards point at it strongly; see `docs/features/whats-bugging-you.md` for what it needs.
- The per-area coach (Phase 3) opens from the rating and its gaps and proposes one step.
- Log-based ratings replacing the questionnaire number as logs accumulate.
- A chart of each area's ratings over time next to the WHO-5 line.
- Tune questions, scores, gap wording and band thresholds after real people use it.
