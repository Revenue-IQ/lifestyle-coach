# Steps

Status: built in Phase 3 (web) · Last updated: 2026-11-14

## What it does

A step is one small thing the person agreed with the coach to try, such as "Last coffee before 2pm". It is counted, never dated: do it three times (or whatever the coach set) and the first rung is done. Each time they tap "Did it" the app answers with points and the progress dots fill in. Steps show on the area page and on the home screen. Dropping a step costs nothing and keeps what was logged.

**The ladder (added 2026-11-14).** The first rung is a trial, not a habit, and the card says so. When a rung is finished the same card asks one plain question, "Did it help?" (yes, a bit, not really), then offers to keep going at the next rung: 3 becomes 7, 7 becomes 21. "Keep going" starts the same step again with the bigger count, so it feels like a climb rather than a restart. "Not really" skips the keep-going offer and points to the coach for a different lever. "Enough for now" closes the question without guilt. At the top of the ladder the card says that is a habit now.

## How it works

**Where the code is.** `api/src/routes/steps.ts` and the accept route in `api/src/routes/coach.ts`; tables `steps` and `step_logs` in `api/src/db/schema.ts`; `mobile/src/components/StepCard.tsx` for the card used on home and the area page.

**Routes.** `GET /api/steps` lists the person's steps. `POST /api/steps/:id/log` records one doing of the step, increments the count, marks it done when the target is reached, and returns the award. `POST /api/steps/:id/reflect` stores the "did it help" answer. `POST /api/steps/:id/continue` creates the next rung as a new step row linked by `parent_step_id` and marks the finished one `continued`. `POST /api/steps/:id/close` marks it `closed`. `POST /api/steps/:id/drop` sets it to dropped. Accepting a proposed step is `POST /api/coach/:id/steps` with the message id that proposed it. The home data includes active steps and finished ones whose follow-up is still open, so the question is never lost.

**Points** (`api/src/config/game.ts`): 10 for logging a step, once per step per calendar day, and a finish bonus once per rung that grows with the rung: 20, 40, 80 (`stepDoneBonusByRung`). The banner for a finishing log shows the combined amount. The first rung's target is whatever the coach proposed, clamped to 1 to 7, default 3; the ladder is `stepLadder: [3, 7, 21]` (`api/src/game/ladder.ts`, tested). Answering "did it help" earns nothing, so the answer stays honest.

**The coach knows.** Finished steps go into the coach's context with their count and the person's answer, and the prompt tells it to build on what helped and try a different lever when something did not.

**One active step per area.** The accept route refuses a second one with a clear message. The coach is told about the active step and the code drops any new proposal while one is active.

## Decisions

- **Counted, not dated** — "three times" rather than "three days in a row", as the gamification skill requires. A bad week pauses the step; it never resets it.
- **Points for doing, not for agreeing** — accepting a step earns nothing, so people pick steps they mean to do.
- **Once per step per day** — stops a step being tapped three times in a minute, while still letting several different steps earn on the same day.
- **Dropping is quiet and free** — a step that does not fit should go without guilt. Logged doings stay in `step_logs` for later reflection.
- **A finish bonus that grows with the rung** — finishing a step is a milestone worth a bigger response than a routine log, and finishing 21 is a bigger milestone than finishing 3, in line with "scale the celebration to the act".
- **Three as the first rung, on purpose** — the owner asked whether three nights of an earlier bedtime is enough. It is not, for sleep; it is enough to find out whether the person will do it at all, which is the commonest failure for this audience. The ladder is the answer: three gets them started, seven and twenty-one are where a habit forms. Rejected: a bigger first count, which would turn the first step into something easy to fail.
- **Each rung is its own row** — history stays exact (when each rung was finished, what the person said), the finish bonus applies per rung without special cases, and the coach sees the climb.
- **"Not really" removes the keep-going offer** — more of something that did not help is the wrong next step; the coach is the right one.

## Future

- Feed "did it help" into the area's next rating as evidence alongside the questionnaire.
- Badges for the first finished step, for reaching rung 3, and for finished steps across several areas.
- Show step logs on a timeline next to today's mood and energy.
