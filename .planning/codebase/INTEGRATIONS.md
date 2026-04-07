# External Integrations

**Analysis Date:** 2026-04-07

## APIs & External Services

**Authentication & Identity APIs:**
- GitHub OAuth + GitHub user API - user login and profile fetch
  - SDK/Client: `ofetch` through `myFetch` in `server/utils/fetch.ts`
  - Auth: `G_CLIENT_ID`, `G_CLIENT_SECRET`, `JWT_SECRET` (`server/api/oauth/github.ts`, `server/api/login.ts`, `server/middleware/auth.ts`)

**Content Providers (news/trends sources):**
- Multiple third-party sites and APIs (GitHub Trending, Hacker News, Bilibili, Zhihu, Product Hunt, etc.) consumed by source adapters in `server/sources/`
  - SDK/Client: `ofetch`, `cheerio`, `fast-xml-parser`, `iconv-lite` (`server/utils/fetch.ts`, `server/sources/*.ts`)
  - Auth: `PRODUCTHUNT_API_TOKEN` required by `server/sources/producthunt.ts`

**Protocol Integrations:**
- Model Context Protocol (MCP) over HTTP endpoint at `/api/mcp` for tool-style news access
  - SDK/Client: `@modelcontextprotocol/sdk` (`server/api/mcp.post.ts`, `server/mcp/server.ts`)
  - Auth: Reuses API middleware behavior; no dedicated MCP secret in repo config

## Data Storage

**Databases:**
- SQLite via DB0 + `better-sqlite3` in default/local node runtime
  - Connection: configured by Nitro database defaults (`nitro.config.ts`)
  - Client: `useDatabase()` + `db0` abstraction (`server/database/cache.ts`, `server/database/user.ts`)
- Cloudflare D1 when running on Cloudflare Pages
  - Connection: `NEWSNOW_DB` binding (`nitro.config.ts`, `example.wrangler.toml`)
  - Client: DB0 `cloudflare-d1` connector (`nitro.config.ts`)
- Bun SQLite in Bun preset
  - Connection: Nitro `bun-sqlite` connector (`nitro.config.ts`)

**File Storage:**
- Local filesystem only for static assets/build output (`public/`, `dist/output/`, `Dockerfile`)
- Docker persistent volume for app data: `newsnow_data` mounted at `/usr/app/.data` (`docker-compose.yml`, `docker-compose.local.yml`)

**Caching:**
- Database-backed cache table (`cache`) managed in app code, not external cache service (`server/database/cache.ts`)
- Cache behavior toggled by `ENABLE_CACHE` and `INIT_TABLE` (`example.env.server`, `server/database/cache.ts`)

## Authentication & Identity

**Auth Provider:**
- GitHub OAuth (single provider)
  - Implementation: OAuth code exchange at `server/api/oauth/github.ts`, redirect bootstrap at `server/api/login.ts`, auth availability probe at `server/api/enable-login.ts`, JWT validation middleware at `server/middleware/auth.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/Datadog/Rollbar integration found)

**Logs:**
- App logging via `consola` wrapper (`server/utils/logger.ts`)
- Cloudflare deployment tail command through Wrangler script (`package.json` `log`)

## CI/CD & Deployment

**Hosting:**
- Cloudflare Pages target with optional D1 integration (`README.md`, `example.wrangler.toml`, `nitro.config.ts`)
- Vercel Edge preset support (`nitro.config.ts`)
- Self-hosted Node container support (`Dockerfile`, `docker-compose.yml`)

**CI Pipeline:**
- GitHub Actions release pipeline (`.github/workflows/release.yml`)
- GitHub Actions Docker multi-arch image build/publish to GHCR (`.github/workflows/docker.yml`)

## Environment Configuration

**Required env vars:**
- `G_CLIENT_ID` - GitHub OAuth client id (`server/api/login.ts`, `server/api/oauth/github.ts`)
- `G_CLIENT_SECRET` - GitHub OAuth client secret (`server/api/oauth/github.ts`)
- `JWT_SECRET` - JWT signing/verification secret (`server/api/oauth/github.ts`, `server/middleware/auth.ts`)
- `INIT_TABLE` - DB table bootstrap behavior (`server/database/cache.ts`, `server/api/me/sync.ts`)
- `ENABLE_CACHE` - cache enable/disable switch (`server/database/cache.ts`)
- `PRODUCTHUNT_API_TOKEN` - Product Hunt GraphQL bearer token (`server/sources/producthunt.ts`)
- `CF_PAGES` / `VERCEL` / `BUN` - runtime preset switchers (`nitro.config.ts`)
- `SW_DEV` - PWA dev service worker toggle (`pwa.config.ts`)

**Secrets location:**
- Local server env file: `.env.server` loaded by Vite config (`vite.config.ts`)
- Sample template: `example.env.server`
- Cloudflare/GitHub CI secrets are expected in platform secret stores (`example.wrangler.toml`, `.github/workflows/*.yml`)

## Webhooks & Callbacks

**Incoming:**
- OAuth callback endpoint: `/api/oauth/github` (`server/api/oauth/github.ts`)
- MCP HTTP POST endpoint: `/api/mcp` (`server/api/mcp.post.ts`)
- News API endpoints consumed by clients: `/api/s`, `/api/s/entire`, `/api/me/sync` (`server/api/s/index.ts`, `server/api/s/entire.post.ts`, `server/api/me/sync.ts`)

**Outgoing:**
- OAuth token exchange request to `https://github.com/login/oauth/access_token` (`server/api/oauth/github.ts`)
- OAuth profile request to `https://api.github.com/user` (`server/api/oauth/github.ts`)
- Source polling requests to third-party services in `server/sources/*.ts`
- No webhook delivery integration detected

---

*Integration audit: 2026-04-07*
