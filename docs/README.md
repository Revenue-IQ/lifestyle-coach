# Wellbeing docs

Index of every doc in this project. Add a line here whenever a doc is created.

## Architecture

- [Tech stack](architecture/tech-stack.md) — the locked technology choices, how the AI and the knowledge base fit in, and why each decision was made.

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
