# Inner Weather docs

The product is called Inner Weather (named 2026-11-15, from the teammates' buildathon material). The repository, packages and database keep the code name Wellbeing.

Index of every doc in this project. Add a line here whenever a doc is created.

## Architecture

- [Tech stack](architecture/tech-stack.md) — the locked technology choices, how the AI and the knowledge base fit in, and why each decision was made.
- [Knowledge base](architecture/knowledge-base.md) — the guidance notes in our own words with their sources, how they are embedded in pgvector, and how the coach retrieves them.
- [Brand](architecture/brand.md) — the Inner Weather mark (a sun clearing a horizon), where it appears, how the icon files are rendered from one SVG, and why it looks the way it does.
- [Deployment](architecture/deployment.md) — one Lightsail instance, two containers, the GitHub Actions pipeline that builds the image and deploys it over SSH, the one-time server setup, and why each piece is the way it is.

## Project skills

These are not docs, but they hold product rules that every screen must follow. They live in `.claude/skills/` and are loaded by the AI coding assistant when it works on this project.

- `asking-for-input` — every question explains why it is asked, with light humour, and almost nothing is mandatory.
- `gamification` — rewards for adding information, points, quests and progress, with no daily streaks, and the rules that keep the game kind.

## Features

The first-session flow, in the order a person meets it. Built in Phase 1 (web) on 2026-11-14. How to run it is in the root [README](../README.md).

- [What's bugging you](features/whats-bugging-you.md) — the first screens, before login: two rounds of cards (how you feel, what your days are like), a "where to look first" card, then save by logging in. Two rounds since Phase 4.
- [Profile ("About you")](features/profile.md) — the few skippable facts (name, over 18, age, sex, weight, activity level) that sharpen ratings, and what is deliberately not collected.
- [Wellbeing check-in](features/wellbeing-check-in.md) — the WHO-5 two-week baseline score and the quick "today" mood and energy entry.
- [Points and levels](features/points-and-levels.md) — what each contribution earns, the caps, the level thresholds, the quests, and the ledger they are computed from.

Phase 2 (web), built 2026-11-14:

- [Area ratings](features/area-ratings.md) — the five "how it usually is" questionnaires, the rating out of 100 with named gaps, the ranked home screen, and why Emotions became Social belonging.

Phase 3 (web), built 2026-11-14:

- [Coach](features/coach.md) — the per-area coach that opens from the rating, talks from the knowledge base, proposes one step, and the safety rules enforced in code.
- [Sample eval and safety run, 2026-11-15](evals/2026-11-15-sample-run.md) — 24 of the 157 team test cases replayed before and after the buildathon rules, case by case, with the replies in `docs/evals/runs/`, the findings and the limits of the sample.
- [Evals](features/evals.md) — the teammates' test cases replayed through the API: how the harness maps cards and areas, the checks code can do, what a person still grades, and what it costs in model calls.
- [Steps](features/steps.md) — the small counted steps agreed with the coach, how they earn points, and the one-active-step rule.

Demo:

- [Demo video](demo/storyboard.md) — the 2026-11-15 walkthrough of every screen (`demo/inner-weather-demo.mp4`), its storyboard, and how to re-render it after the app changes.
