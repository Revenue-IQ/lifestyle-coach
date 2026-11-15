# Wellbeing

An app for people who feel stuck and want to work out where to look first. Web now, iOS and Android later from the same code. Product rules live in `.claude/skills/` and the docs in `docs/` (start at [docs/README.md](docs/README.md)).

## Layout

| Folder | What |
|---|---|
| `shared/` | Content both sides use: the complaint list and its area map, WHO-5, every input's definition with its "why we ask" text. |
| `api/` | Hono + Drizzle + Postgres backend. Owns scoring, points, levels and quests. |
| `mobile/` | Expo app (Expo Router, NativeWind). Runs as a web app today. |

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

## Deploy

Every push to `main` builds the Docker image in GitHub Actions, pushes it to GitHub's container registry and deploys it over SSH to one Lightsail instance running the app and Postgres (with pgvector) under docker-compose. The public address is plain HTTP on the instance's static IP. One-time server setup, the GitHub secrets it needs, day-to-day commands and every decision are in [docs/architecture/deployment.md](docs/architecture/deployment.md).

To build and run the production image locally (needs Docker):

```bash
docker build -t wellbeing:local --build-arg EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... .
```

Then run `docker-compose.prod.yml` from a folder holding a `.env` made from `deploy/env.production.example` with `APP_IMAGE=wellbeing:local` added, and open http://localhost.
