# syntax=docker/dockerfile:1
# The Wellbeing app image: the API plus Expo's web build, served from one container.
# Build from the repository root (the API imports shared/, the app imports the API's types).
# Decisions and the why are in docs/architecture/deployment.md.

# 1. Install every workspace once, from the lockfile.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY mobile/package.json mobile/
RUN npm ci

# 2. Export the web app. EXPO_PUBLIC_* values are baked into the bundle here.
#    An empty EXPO_PUBLIC_API_URL means "same origin as the page".
FROM deps AS web
COPY shared shared
COPY api api
COPY mobile mobile
ARG EXPO_PUBLIC_API_URL=""
ARG EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=""
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY \
    CI=1 EXPO_NO_TELEMETRY=1
RUN cd mobile && npx expo export --platform web

# 3. Runtime: only the API and shared workspaces (with tsx and drizzle-kit, which the
#    API's dev dependencies hold), plus the exported web build. No Expo in this image.
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY mobile/package.json mobile/
RUN npm ci --workspace api --workspace shared && npm cache clean --force
COPY shared/src shared/src
COPY api/src api/src
COPY api/drizzle.config.ts api/tsconfig.json api/
COPY --from=web /app/mobile/dist mobile/dist
ENV NODE_ENV=production PORT=8787 WEB_DIST_DIR=/app/mobile/dist
EXPOSE 8787
USER node
CMD ["node_modules/.bin/tsx", "api/src/index.ts"]
