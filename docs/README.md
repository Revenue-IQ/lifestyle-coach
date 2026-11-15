# Wellbeing docs

Index of every doc in this project. Add a line here whenever a doc is created.

## Architecture

- [Tech stack](architecture/tech-stack.md) — the locked technology choices, how the AI and the knowledge base fit in, and why each decision was made.
- [Knowledge base](architecture/knowledge-base.md) — the guidance notes in our own words with their sources, how they are embedded in pgvector, and how the coach retrieves them.
- [Deployment](architecture/deployment.md) — one Lightsail instance, two containers, the GitHub Actions pipeline that builds the image and deploys it over SSH, the one-time server setup, and why each piece is the way it is.

## Project skills

These are not docs, but they hold product rules that every screen must follow. They live in `.claude/skills/` and are loaded by the AI coding assistant when it works on this project.

- `asking-for-input` — every question explains why it is asked, with light humour, and almost nothing is mandatory.
- `gamification` — rewards for adding information, points, quests and progress, with no daily streaks, and the rules that keep the game kind.

## Features

The first-session flow, in the order a person meets it. Built in Phase 1 (web) on 2026-11-14. How to run it is in the root [README](../README.md).

- [What's bugging you](features/whats-bugging-you.md) — the first screen, before login: pick complaints, get a "where to look first" card, then save by logging in.
- [Profile ("About you")](features/profile.md) — the few skippable facts (name, over 18, age, sex, weight, activity level) that sharpen ratings, and what is deliberately not collected.
- [Wellbeing check-in](features/wellbeing-check-in.md) — the WHO-5 two-week baseline score and the quick "today" mood and energy entry.
- [Points and levels](features/points-and-levels.md) — what each contribution earns, the caps, the level thresholds, the quests, and the ledger they are computed from.

Phase 2 (web), built 2026-11-14:

- [Area ratings](features/area-ratings.md) — the five "how it usually is" questionnaires, the rating out of 100 with named gaps, the ranked home screen, and why Emotions became Social belonging.

Phase 3 (web), built 2026-11-14:

- [Coach](features/coach.md) — the per-area coach that opens from the rating, talks from the knowledge base, proposes one step, and the safety rules enforced in code.
- [Steps](features/steps.md) — the small counted steps agreed with the coach, how they earn points, and the one-active-step rule.
