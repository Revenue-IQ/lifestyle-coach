# Deployment

Status: built on 2026-11-14 for the Buildathon demo · Last updated: 2026-11-14

## What this covers

How the Wellbeing app reaches a public address: what runs on the server, how a push to GitHub becomes a new version on that server, the one-time setup the project owner does by hand, and every decision with its why. The technology choices themselves (one Lightsail instance, two containers, a GitHub pipeline) were made when the stack was locked and are recorded in [tech-stack.md](tech-stack.md); this doc records how they were carried out.

## What exists

- **One Amazon Lightsail instance** (Ubuntu 24.04, 1 GB RAM, a static IP) running Docker.
- **Two containers under docker-compose** in `/opt/wellbeing` on the instance:
  - `app` — the API and the web app in one image. The API serves Expo's web export from the same origin, so the app calls `/api/...` on the address it was loaded from.
  - `db` — Postgres 17 with pgvector (`pgvector/pgvector:pg17`), its data on a named Docker volume so it survives redeploys.
- **The image** is built by GitHub Actions and stored in GitHub's container registry as `ghcr.io/revenue-iq/lifestyle-coach`, tagged `latest` and with the commit SHA.
- **The pipeline** (`.github/workflows/deploy.yml`) runs on every push to `main`: build and push the image, then SSH into the instance, copy the compose file, write the server's env file from the repository secrets, pull the image, restart, push the database schema, and check `/health`.
- **The address** is plain HTTP on the static IP (`http://<static-ip>`). No domain, no certificate, by the owner's decision for the demo.

Files in the repository:

| File | What |
|---|---|
| `Dockerfile` | Multi-stage build: install workspaces, export the web app, assemble the runtime image. |
| `.dockerignore` | Keeps `node_modules`, `.git`, every `.env` and the docs out of the build context. |
| `docker-compose.prod.yml` | The two services. Copied to the server as `docker-compose.yml` on every deploy. |
| `deploy/db/init.sql` | `CREATE EXTENSION IF NOT EXISTS vector`, run by Postgres when its volume is first created. |
| `deploy/env.production.example` | The shape of the server's `.env`, for running the production compose file locally. In production the pipeline writes that file. |
| `.github/workflows/deploy.yml` | The pipeline. |
| `.github/workflows/kb-load.yml` | Manual workflow that loads the knowledge notes on the server. |

## How it works

### The image

1. `npm ci` installs all three workspaces from the lockfile.
2. `npx expo export --platform web` runs inside `mobile/`. The two `EXPO_PUBLIC_*` values are build arguments and are baked into the JavaScript bundle at this point: `EXPO_PUBLIC_API_URL` is set to an empty string, which makes Hono's typed client use relative URLs (same origin), and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is Clerk's publishable key.
3. The runtime stage starts from a clean Node 22 image and installs only the `api` and `shared` workspaces (`npm ci --workspace api --workspace shared`), then copies in `api/src`, `shared/src` and the exported `mobile/dist`. Expo and the mobile dependencies are not in the final image.
4. The container runs `tsx api/src/index.ts` as the unprivileged `node` user with `WEB_DIST_DIR=/app/mobile/dist` and `PORT=8787`.

### Serving the web app

`api/src/app.ts` reads `WEB_DIST_DIR`. When set, it adds two handlers after the API routes: a static file handler for the export, and a catch-all that returns `index.html` for any other `GET`, so Expo Router's URLs (for example `/areas/sleep/coach`) load on refresh. Unknown `/api/...` paths still return 404. When `WEB_DIST_DIR` is unset, which it is in local development, nothing changes and Expo's dev server serves the app.

### A deploy, step by step

1. Push to `main` (or run the workflow by hand from the Actions tab).
2. **Build job:** logs in to the registry with the job's own token, builds the image with the build arguments above, pushes `:latest` and `:<sha>`. Layers are cached in GitHub Actions' cache, so an unchanged dependency set does not reinstall.
3. **Deploy job:** checks the secrets exist and fails with the missing name if not, writes the deploy key from the `LIGHTSAIL_SSH_KEY` secret, SSHes to `LIGHTSAIL_HOST` as `ubuntu`, prepares the server if needed (Docker, docker group, swap file, `/opt/wellbeing`), copies `docker-compose.prod.yml` and `deploy/db/init.sql` into `/opt/wellbeing`, writes `/opt/wellbeing/.env` from the `POSTGRES_PASSWORD`, `CLERK_SECRET_KEY` and `GEMINI_API_KEY` secrets (plus `AUTH_MODE` and any `EXTRA_ENV` lines from the repository variables), logs the server in to the registry with the job token, runs `docker compose pull app && docker compose up -d`, then `npm run db:push -w api -- --force` inside the app container, then polls `http://localhost/health` and prints the app's logs if it does not answer. Finally it prunes old images so the small disk does not fill.

Every secret lives in GitHub; the server holds only what the last deploy wrote. `DATABASE_URL` is assembled in the compose file from `POSTGRES_PASSWORD`, so the password exists in one secret.

### What is not automatic

- **Loading the knowledge notes** (`kb:load`). It embeds every changed note through Gemini, so it is a separate workflow, **Load knowledge notes** (`.github/workflows/kb-load.yml`), run by hand from the Actions tab: once after the first deploy and again when the notes change. It runs the loader inside the app container over SSH, the same way the deploy does. Unchanged notes are skipped, so re-running it costs nothing.
- **Backups.** Nothing backs up the Postgres volume. Accepted for the demo (see tech-stack.md).

## One-time setup

Done by the project owner, who holds the AWS account, the GitHub repository and every secret. About ten minutes: the instance, its key, and the GitHub secrets. The pipeline does the rest, including installing Docker.

### 1. The Lightsail instance

1. In the Lightsail console, **Create instance**. Pick the region closest to the judges. Platform Linux/Unix, blueprint **OS only → Ubuntu 24.04 LTS**. Plan: the 1 GB RAM one (2 GB if you want headroom). Name it `wellbeing`. Create.
2. **Networking tab → Create static IP**, attach it to the instance. The address does not change when the instance restarts. Note it: this is `LIGHTSAIL_HOST`.
3. In the instance's **Networking** tab, check the IPv4 firewall has **SSH (22)** and **HTTP (80)**. Both are there by default.

### 2. Docker and a swap file on the instance

Nothing to do. The deploy job's first step over SSH installs Docker with Docker's official script if it is missing, adds `ubuntu` to the docker group, adds a 1 GB swap file if there is none, and creates `/opt/wellbeing`. The step is idempotent, so later runs pass through it in a second.

### 3. The deploy key

Two options. The pipeline needs a private key that `ubuntu` on the instance accepts.

**Option A, the instance's default key (quickest).** Lightsail created a key pair with the instance and its public half is already on it. Download the private half from **Account → SSH keys** (a `.pem` file), keep it at `~/.ssh/lightsail.pem` with `chmod 400`, and its contents become the `LIGHTSAIL_SSH_KEY` secret. Cost: that key is also your own admin key for every instance in the region that uses the default pair, so revoking the pipeline later means rotating it everywhere. Fine for a demo.

**Option B, a dedicated key (cleaner revocation).** On your Mac, make a key pair used only by the pipeline:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/wellbeing-deploy -C wellbeing-deploy -N ""
```

Print the public half with `cat ~/.ssh/wellbeing-deploy.pub`, then in the instance's terminal append that one line to `~/.ssh/authorized_keys`:

```bash
echo 'ssh-ed25519 AAAA... wellbeing-deploy' >> ~/.ssh/authorized_keys
```

Check from the Mac: `ssh -i ~/.ssh/wellbeing-deploy ubuntu@<static-ip> docker ps`. Revoking it later is deleting that one line from `authorized_keys`.

### 4. The server folder

Nothing to do: created by the same preparation step. Nothing is ever typed on the server. The compose file, `db/init.sql` and `.env` all arrive with the first deploy.

### 5. GitHub repository settings

**Settings → Secrets and variables → Actions.**

| Kind | Name | Value |
|---|---|---|
| Secret | `LIGHTSAIL_HOST` | the static IP |
| Secret | `LIGHTSAIL_SSH_KEY` | the whole private key file: `~/.ssh/lightsail.pem` (option A) or `~/.ssh/wellbeing-deploy` (option B) |
| Secret | `POSTGRES_PASSWORD` | letters and digits, made up once. Never change it afterwards: Postgres keeps the password its volume was created with |
| Secret | `CLERK_SECRET_KEY` | Clerk's `sk_test_...` key. Required unless `AUTH_MODE` is `dev` |
| Secret | `GEMINI_API_KEY` | the Gemini key. Empty switches the coach off |
| Variable | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk's `pk_test_...` key; a secret of the same name also works. Leave unset, with `AUTH_MODE` set to `dev`, to build with the app's own dev sign-in. The build fails if the two disagree |
| Variable | `AUTH_MODE` | optional, default `clerk`; `dev` for the built-in sign-in |
| Variable | `LIGHTSAIL_USER` | optional, default `ubuntu` |
| Variable | `EXTRA_ENV` | optional extra lines for the server env file, for example `GEMINI_TEXT_MODEL=...` |

From a Mac with the GitHub CLI, each is one command, for example `gh secret set GEMINI_API_KEY --repo Revenue-IQ/lifestyle-coach --body "..."` and `gh secret set LIGHTSAIL_SSH_KEY --repo Revenue-IQ/lifestyle-coach < ~/.ssh/wellbeing-deploy`.

The image registry needs no setting: the workflow uses the job's own token, and the package is created on the first push, private and linked to the repository.

### 6. First deploy

Commit and push to `main`. Watch the **Actions** tab. When the deploy job is green, open `http://<static-ip>`: the first screen loads and `http://<static-ip>/health` answers `{"ok":true}`. Then run the **Load knowledge notes** workflow once from the Actions tab.

### Day to day

- **Logs:** `cd /opt/wellbeing && docker compose logs -f app`
- **Roll back:** `APP_IMAGE=ghcr.io/revenue-iq/lifestyle-coach:<sha> docker compose up -d` in `/opt/wellbeing`.
- **Switch to the built-in dev sign-in:** remove the `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` variable in GitHub, set the `AUTH_MODE` variable to `dev`, re-run the workflow. The app then shows the developer sign-in, where any email is accepted.
- **Change a secret:** change it in GitHub and re-run the workflow. The deploy rewrites the server's env file and restarts the app.
- **Rebuild the server from nothing:** a new instance with the same key and IP (steps 1 and 3), then re-run the workflow. It installs Docker and everything else itself.

## Decisions

- **Image built in the pipeline, never on the instance** — a 1 GB server running Postgres cannot also run `npm ci` for three workspaces and an Expo export; it would swap or be killed. GitHub's runners have 7 GB. The server only pulls.
- **GitHub Container Registry, not Docker Hub or Amazon ECR** — it is free, it is next to the code, and the pipeline authenticates with the job's own token, so no registry credential exists anywhere. The deploy job logs the server in with that same short-lived token right before the pull. Rejected: ECR, which would need AWS credentials in GitHub and an extra service to set up.
- **One image for API and web app** — the tech-stack doc fixed two containers. Serving the export from the API also removes CORS from the picture and lets the app use relative URLs, so the same image works at any address.
- **Same-origin API URL via an empty `EXPO_PUBLIC_API_URL`** — Hono's client builds `'' + '/api/me'`, a relative URL. Checked against a real export: the bundle contains no `localhost:8787`. The alternative, baking in the public URL, would tie the image to one address. Cost: the image is built for the web; a native build later needs a real URL, which the mobile phase sets.
- **tsx at runtime, not a compiled bundle** — the API already runs under tsx everywhere, and `shared/` is TypeScript source with no build step. A bundler would add configuration to maintain for a saving of a few megabytes and a fraction of a second at start. Cost: `tsx` and `drizzle-kit` are the API's dev dependencies, so the runtime image installs the `api` workspace with its dev dependencies. Expo is still left out by installing only the `api` and `shared` workspaces.
- **Every secret in GitHub; the pipeline writes the server's env file on each deploy** — the first version had the owner type the Gemini and Clerk keys into a file on the server so the pipeline would never see them. The owner pointed out that this protected nothing: the deploy key logs in as a user in the docker group, so whatever holds that key can read the server's file anyway. With equal exposure, one place to manage secrets, no manual step on the server, "change the secret and re-run" rotation and a server that can be rebuilt from steps 1 to 4 plus one workflow run are strictly better. GitHub masks secret values in logs. The template `deploy/env.production.example` stays for local runs of the production compose file.
- **SSH with a dedicated deploy key** — the simplest way for GitHub Actions to reach a plain server. The key pair exists only for this and can be revoked by deleting one line in `authorized_keys`. The host key is accepted on first connection (`StrictHostKeyChecking accept-new`), which trusts the first contact; pinning the host key would be the step up if this were more than a demo.
- **`db:push --force` on every deploy** — the schema is still changing daily during the Buildathon, and a deploy whose code expects a column the database lacks is a broken demo. `--force` accepts drizzle-kit's prompts about destructive changes, so a column rename would drop data. Accepted for the demo, where the data is test data. Before real users: generated migrations (`db:generate` and `db:migrate`), which the scripts already exist for.
- **`kb:load` by hand** — it costs Gemini quota for every changed note and the notes change rarely. Running it on each deploy would spend quota on demo day for nothing.
- **Plain HTTP on the static IP, no domain** — the owner's call for the demo: anyone can open the address, and nothing in the app needs a secure context today. A bare IP cannot get a browser-trusted certificate, so HTTPS needs a hostname. If one appears, the step up is a third container (Caddy) with automatic Let's Encrypt certificates; the compose file gains one service and the app's port mapping moves behind it. Free hostname options noted for that moment: sslip.io (no signup, shared rate limits) or DuckDNS (an account, reliable).
- **Clerk's development instance, over HTTP** — the owner has Clerk dev keys and chose them over the app's own dev sign-in. The app and the API both support either, chosen by whether the publishable key is set at build time and `AUTH_MODE` on the server, so the fallback is one setting change and one pipeline run.
- **1 GB instance with a swap file** — nothing is built on it, so the load is Node, Postgres at default settings and Docker. The swap file is a safety net for the moment a new image is unpacked.
- **Compose file copied by the pipeline, no git on the server** — the server holds three files (`docker-compose.yml`, `db/init.sql`, `.env`) and nothing else from the repository. Cloning would put the source and the Gemini-key-free `.env.example` on the server for no use.
- **The pipeline prepares the server too (Docker, swap, folder)** — the first version had the owner run those commands by hand over SSH, which needed the IP and a terminal session for a one-off. The owner asked why anything beyond GitHub needed the address at all; nothing does. The step checks before each action, so it is safe on every run, and a replacement instance needs only the key and the IP. Docker's own install script is used because it is the shortest path on a fresh Ubuntu and this is a demo server. Docker commands in the deploy run under `sg docker` because the SSH session that just granted the group would not otherwise have it.
- **`:latest` plus a SHA tag** — compose pulls `latest`, which keeps the owner's manual commands simple; the SHA tag exists for rollback.
- **Health check inside the deploy job** — the pipeline is red, with the app's last fifty log lines, when the container starts but does not answer. Without it a broken deploy looks green.
- **Checked locally before the first pipeline run** — the image was built and run on the owner's Mac with Docker Desktop against the production compose file: `db:push` created the tables, the vector extension was present from the init script, `/`, `/home` and a deep route returned the page, assets were served, and the API answered as before.

## Future

- **HTTPS with a hostname** — Caddy as a third container when a domain or free subdomain is chosen.
- **Backups** — scheduled dumps of the Postgres volume or a managed database, before real users.
- **Generated migrations instead of `db:push --force`** — before real data exists.
- **Pinned host key** and a non-root `docker` setup on the server, if the instance outlives the demo.
- **Mobile builds** through Expo's build service; the web image is unaffected.
