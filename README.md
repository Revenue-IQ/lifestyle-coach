<img src="mobile/assets/brand/lockup.png" alt="Inner Weather" width="480">

# Inner Weather

**Live demo: http://44.252.153.200** (plain HTTP, Buildathon build, US resources)

An app for people who feel stuck and want to work out where to look first. It asks what's bugging you, points at the one or two life areas most likely behind it, rates each area from a short questionnaire, and then a coach for that area talks you into one small step you can actually count. Web now, iOS and Android later from the same code.

The product is called Inner Weather. The repository, packages and database keep the code name Wellbeing.

## The problem

A lot of people feel tired, flat, foggy or just "off" without being ill. They are not in the clinic's lane, and a general chatbot is happy to talk for an hour without ever narrowing anything down. The usual outcomes are a search spiral at 2am, a stack of unrelated supplements, or giving up.

The gap is between "something is wrong" and "I know where to start". Six everyday levers explain most of this gray zone: sleep, food, movement, gut health, social contact and downtime. Working out which one is dragging the rest down, and changing one small thing there, is where people get unstuck. Nothing on the market does that identification step gently, in a few minutes, and then keeps the follow-through small enough to finish.

## What it does

1. **What's bugging you.** Two rounds of cards before any login: how you have been feeling, then what your days are like. You get a "where to look first" card straight away, then sign in only if you want to keep it.
2. **A rating for each area.** Six short "how it usually is" questionnaires, every question skippable, scored by code into a rating out of 100 with its named gaps. Home lists the areas worth a look first.
3. **A two-week baseline.** The WHO-5 wellbeing index, so progress is measured by how you feel, not by how virtuously you answered.
4. **A coach per area.** It speaks first from your rating, answers only from our own knowledge notes with sources shown, stays in its lane, and proposes one step. Crisis language, medical drift, under-18s and pregnancy are handled in code, not left to the model.
5. **Counted steps.** "Last coffee before 2pm" three times, then seven, then twenty-one if it helped. Points for showing up, no streaks, nothing ever taken away.

It is not medical advice and says so. Product rules live in `.claude/skills/`, the docs in `docs/` (start at [docs/README.md](docs/README.md)).

## Try it

Open http://44.252.153.200, tap a few cards, and read the "where to look first" card. Saving it asks for an email and sends a sign-in code (Clerk, development instance). Rate an area, open its coach, and take the step it offers. The home screen shows the picture so far.

Everything typed into the coach goes to Google's Gemini on the free tier. Treat it as a demo, not a diary.

## Layout

| Folder | What |
|---|---|
| `shared/` | Content both sides use: the cards and their area map, WHO-5, the six questionnaires, every input's "why we ask" text, the crisis detector. |
| `api/` | Hono + Drizzle + Postgres (pgvector) backend. Owns scoring, points, levels, the coach, retrieval and every safety rule. |
| `mobile/` | Expo app (Expo Router, NativeWind). Runs as a web app today. |
| `buildathon/` | Teammates' agent prompt and eval CSVs, and the results of running them. |
| `deploy/`, `.github/workflows/` | Docker image, production compose file, the push-to-main pipeline. |

## Run it locally

Needs Node 22 and a Postgres you can reach. On this Mac the Homebrew Postgres 17 is used directly; elsewhere `docker compose up -d` starts one with pgvector.

```bash
npm install
```

```bash
createdb wellbeing
```

```bash
cp api/.env.example api/.env && cp mobile/.env.example mobile/.env
```

```bash
npm run db:push
```

Then, in two terminals:

```bash
npm run api
```

```bash
npm run web
```

The web app is at http://localhost:8081 and the API at http://localhost:8787.

**The coach needs a Gemini key.** Put `GEMINI_API_KEY=...` in `api/.env` (free tier is fine for the demo), then load the knowledge base once:

```bash
npm run kb:load -w api
```

Without the key the coach shows "not switched on" and everything else works. The local Postgres needs the pgvector extension (`brew install pgvector`, then `CREATE EXTENSION vector;` in the database); the Docker image has it built in.

**Sign-in without Clerk keys.** With `AUTH_MODE=dev` in `api/.env` and no `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `mobile/.env`, the sign-in screen is a developer sign-in: any email works, nothing is sent. To use Clerk, create a free Clerk application with email-code sign-in, put its secret key in `api/.env` (and set `AUTH_MODE` to anything but `dev`) and its publishable key in `mobile/.env`.

## Checks

```bash
npm test
```

```bash
npm run typecheck -w api && npm run typecheck -w mobile
```

The teammates' eval sets replay through a running local API and write a results sheet for grading (costs real model quota, so start with the safety set):

```bash
npm run eval -w api -- --file safety
```

See [docs/features/evals.md](docs/features/evals.md).

## Deploy

Every push to `main` builds the Docker image in GitHub Actions, pushes it to GitHub's container registry and deploys it over SSH to one Lightsail instance running the app and Postgres (with pgvector) under docker-compose. The public address is plain HTTP on the instance's static IP. One-time server setup, the GitHub secrets it needs, day-to-day commands and every decision are in [docs/architecture/deployment.md](docs/architecture/deployment.md).

To build and run the production image locally (needs Docker):

```bash
docker build -t wellbeing:local --build-arg EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... .
```

Then run `docker-compose.prod.yml` from a folder holding a `.env` made from `deploy/env.production.example` with `APP_IMAGE=wellbeing:local` added, and open http://localhost.
