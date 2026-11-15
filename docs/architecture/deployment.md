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
- **The pipeline** (`.github/workflows/deploy.yml`) runs on every push to `main`: build and push the image, then SSH into the instance, copy the compose file, pull the image, restart, push the database schema, and check `/health`.
- **The address** is plain HTTP on the static IP (`http://<static-ip>`). No domain, no certificate, by the owner's decision for the demo.

Files in the repository:

| File | What |
|---|---|
| `Dockerfile` | Multi-stage build: install workspaces, export the web app, assemble the runtime image. |
| `.dockerignore` | Keeps `node_modules`, `.git`, every `.env` and the docs out of the build context. |
| `docker-compose.prod.yml` | The two services. Copied to the server as `docker-compose.yml` on every deploy. |
| `deploy/db/init.sql` | `CREATE EXTENSION IF NOT EXISTS vector`, run by Postgres when its volume is first created. |
| `deploy/env.production.example` | Template for the server's `.env` (secrets). The filled-in file lives only on the server. |
| `.github/workflows/deploy.yml` | The pipeline. |

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
3. **Deploy job:** writes the deploy key from the `LIGHTSAIL_SSH_KEY` secret, SSHes to `LIGHTSAIL_HOST` as `ubuntu`, copies `docker-compose.prod.yml` and `deploy/db/init.sql` into `/opt/wellbeing`, logs the server in to the registry with the job token, runs `docker compose pull app && docker compose up -d`, then `npm run db:push -w api -- --force` inside the app container, then polls `http://localhost/health` and prints the app's logs if it does not answer. Finally it prunes old images so the small disk does not fill.

The server's `.env` is never touched by the pipeline. `DATABASE_URL` is assembled in the compose file from `POSTGRES_PASSWORD`, so the password is typed once.

### What is not automatic

- **Loading the knowledge notes** (`kb:load`). It embeds every changed note through Gemini, so it is run by hand, once after the first deploy and again when the notes change:
  ```bash
  cd /opt/wellbeing && docker compose exec app node_modules/.bin/tsx api/src/knowledge/load.ts
  ```
- **Backups.** Nothing backs up the Postgres volume. Accepted for the demo (see tech-stack.md).

## One-time setup

Done by the project owner, who holds the AWS account, the GitHub repository and every secret. About twenty minutes.

### 1. The Lightsail instance

1. In the Lightsail console, **Create instance**. Pick the region closest to the judges. Platform Linux/Unix, blueprint **OS only → Ubuntu 24.04 LTS**. Plan: the 1 GB RAM one (2 GB if you want headroom). Name it `wellbeing`. Create.
2. **Networking tab → Create static IP**, attach it to the instance. The address does not change when the instance restarts. Note it: this is `LIGHTSAIL_HOST`.
3. In the instance's **Networking** tab, check the IPv4 firewall has **SSH (22)** and **HTTP (80)**. Both are there by default.

### 2. Docker and a swap file on the instance

Open the browser-based SSH terminal from the instance page (or SSH in with the default key). Run:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

```bash
sudo usermod -aG docker ubuntu
```

```bash
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Log out and in again so the group change applies, then `docker ps` should answer without `sudo`.

### 3. The deploy key

On your Mac, make a key pair used only by the pipeline:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/wellbeing-deploy -C wellbeing-deploy -N ""
```

Print the public half with `cat ~/.ssh/wellbeing-deploy.pub`, then in the instance's terminal append that one line to `~/.ssh/authorized_keys`:

```bash
echo 'ssh-ed25519 AAAA... wellbeing-deploy' >> ~/.ssh/authorized_keys
```

Check from the Mac: `ssh -i ~/.ssh/wellbeing-deploy ubuntu@<static-ip> docker ps`.

### 4. The server folder and its secrets

On the instance:

```bash
sudo mkdir -p /opt/wellbeing/db && sudo chown -R ubuntu:ubuntu /opt/wellbeing
```

Create `/opt/wellbeing/.env` from `deploy/env.production.example` (`nano /opt/wellbeing/.env`, paste the template, fill in `POSTGRES_PASSWORD`, `CLERK_SECRET_KEY`, `GEMINI_API_KEY`), then `chmod 600 /opt/wellbeing/.env`. The compose file and `db/init.sql` arrive with the first deploy.

### 5. GitHub repository settings

**Settings → Secrets and variables → Actions.**

| Kind | Name | Value |
|---|---|---|
| Secret | `LIGHTSAIL_HOST` | the static IP |
| Secret | `LIGHTSAIL_SSH_KEY` | the whole private key file: `cat ~/.ssh/wellbeing-deploy` |
| Variable | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk's `pk_test_...` key. Leave unset to build with the app's own dev sign-in |
| Variable | `LIGHTSAIL_USER` | optional, default `ubuntu` |

The image registry needs no setting: the workflow uses the job's own token, and the package is created on the first push, private and linked to the repository.

### 6. First deploy

Commit and push to `main`. Watch the **Actions** tab. When the deploy job is green, open `http://<static-ip>`: the first screen loads and `http://<static-ip>/health` answers `{"ok":true}`. Then load the knowledge notes once with the command under "What is not automatic".

### Day to day

- **Logs:** `cd /opt/wellbeing && docker compose logs -f app`
- **Roll back:** `APP_IMAGE=ghcr.io/revenue-iq/lifestyle-coach:<sha> docker compose up -d` in `/opt/wellbeing`.
- **Switch to the built-in dev sign-in:** remove the `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` variable in GitHub, set `AUTH_MODE=dev` in the server's `.env`, re-run the workflow. The app then shows the developer sign-in, where any email is accepted.
- **Change a secret:** edit `/opt/wellbeing/.env`, then `docker compose up -d` there.

## Decisions

- **Image built in the pipeline, never on the instance** — a 1 GB server running Postgres cannot also run `npm ci` for three workspaces and an Expo export; it would swap or be killed. GitHub's runners have 7 GB. The server only pulls.
- **GitHub Container Registry, not Docker Hub or Amazon ECR** — it is free, it is next to the code, and the pipeline authenticates with the job's own token, so no registry credential exists anywhere. The deploy job logs the server in with that same short-lived token right before the pull. Rejected: ECR, which would need AWS credentials in GitHub and an extra service to set up.
- **One image for API and web app** — the tech-stack doc fixed two containers. Serving the export from the API also removes CORS from the picture and lets the app use relative URLs, so the same image works at any address.
- **Same-origin API URL via an empty `EXPO_PUBLIC_API_URL`** — Hono's client builds `'' + '/api/me'`, a relative URL. Checked against a real export: the bundle contains no `localhost:8787`. The alternative, baking in the public URL, would tie the image to one address. Cost: the image is built for the web; a native build later needs a real URL, which the mobile phase sets.
- **tsx at runtime, not a compiled bundle** — the API already runs under tsx everywhere, and `shared/` is TypeScript source with no build step. A bundler would add configuration to maintain for a saving of a few megabytes and a fraction of a second at start. Cost: `tsx` and `drizzle-kit` are the API's dev dependencies, so the runtime image installs the `api` workspace with its dev dependencies. Expo is still left out by installing only the `api` and `shared` workspaces.
- **Secrets live in one `.env` on the server, typed once by the owner** — the pipeline never sees the Gemini or Clerk secret key, there is nothing to rotate in GitHub when a key changes, and the server's file is the single place to look. Rejected: storing them as GitHub secrets and writing the file on each deploy, which copies every secret into a second system for no gain at this size.
- **SSH with a dedicated deploy key** — the simplest way for GitHub Actions to reach a plain server. The key pair exists only for this and can be revoked by deleting one line in `authorized_keys`. The host key is accepted on first connection (`StrictHostKeyChecking accept-new`), which trusts the first contact; pinning the host key would be the step up if this were more than a demo.
- **`db:push --force` on every deploy** — the schema is still changing daily during the Buildathon, and a deploy whose code expects a column the database lacks is a broken demo. `--force` accepts drizzle-kit's prompts about destructive changes, so a column rename would drop data. Accepted for the demo, where the data is test data. Before real users: generated migrations (`db:generate` and `db:migrate`), which the scripts already exist for.
- **`kb:load` by hand** — it costs Gemini quota for every changed note and the notes change rarely. Running it on each deploy would spend quota on demo day for nothing.
- **Plain HTTP on the static IP, no domain** — the owner's call for the demo: anyone can open the address, and nothing in the app needs a secure context today. A bare IP cannot get a browser-trusted certificate, so HTTPS needs a hostname. If one appears, the step up is a third container (Caddy) with automatic Let's Encrypt certificates; the compose file gains one service and the app's port mapping moves behind it. Free hostname options noted for that moment: sslip.io (no signup, shared rate limits) or DuckDNS (an account, reliable).
- **Clerk's development instance, over HTTP** — the owner has Clerk dev keys and chose them over the app's own dev sign-in. The app and the API both support either, chosen by whether the publishable key is set at build time and `AUTH_MODE` on the server, so the fallback is one setting change and one pipeline run.
- **1 GB instance with a swap file** — nothing is built on it, so the load is Node, Postgres at default settings and Docker. The swap file is a safety net for the moment a new image is unpacked.
- **Compose file copied by the pipeline, no git on the server** — the server holds three files (`docker-compose.yml`, `db/init.sql`, `.env`) and nothing else from the repository. Cloning would put the source and the Gemini-key-free `.env.example` on the server for no use.
- **`:latest` plus a SHA tag** — compose pulls `latest`, which keeps the owner's manual commands simple; the SHA tag exists for rollback.
- **Health check inside the deploy job** — the pipeline is red, with the app's last fifty log lines, when the container starts but does not answer. Without it a broken deploy looks green.
- **Checked locally before the first pipeline run** — the image was built and run on the owner's Mac with Docker Desktop against the production compose file: `db:push` created the tables, the vector extension was present from the init script, `/`, `/home` and a deep route returned the page, assets were served, and the API answered as before.

## Future

- **HTTPS with a hostname** — Caddy as a third container when a domain or free subdomain is chosen.
- **Backups** — scheduled dumps of the Postgres volume or a managed database, before real users.
- **Generated migrations instead of `db:push --force`** — before real data exists.
- **Pinned host key** and a non-root `docker` setup on the server, if the instance outlives the demo.
- **Mobile builds** through Expo's build service; the web image is unaffected.
