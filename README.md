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

**Sign-in without Clerk keys.** With `AUTH_MODE=dev` in `api/.env` and no `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `mobile/.env`, the sign-in screen is a developer sign-in: any email works, nothing is sent. To use Clerk, create a free Clerk application with email-code sign-in, put its secret key in `api/.env` (and set `AUTH_MODE` to anything but `dev`) and its publishable key in `mobile/.env`.

## Checks

```bash
npm test
```

```bash
npm run typecheck -w api && npm run typecheck -w mobile
```
