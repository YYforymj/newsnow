# Technology Stack

**Analysis Date:** 2026-04-07

## Languages

**Primary:**
- TypeScript 5.9.x - Frontend app, server API routes, shared models, build scripts in `src/`, `server/`, `shared/`, `scripts/` (`package.json`, `tsconfig.base.json`)

**Secondary:**
- JavaScript (ESM) - MCP description module in `server/mcp/desc.js`
- CSS - Global and utility-driven styling in `src/styles/globals.css` with UnoCSS setup in `uno.config.ts`
- TOML/YAML - Cloudflare and container/deployment config in `example.wrangler.toml`, `docker-compose.yml`, `docker-compose.local.yml`

## Runtime

**Environment:**
- Node.js 20+ for development (`README.md`)
- Node.js `20.12.2-alpine` in containerized production (`Dockerfile`)
- Alternate Nitro presets selected by env: Vercel Edge (`VERCEL`), Cloudflare Pages (`CF_PAGES`), Bun (`BUN`) in `nitro.config.ts`

**Package Manager:**
- pnpm `10.30.3` (`package.json` `packageManager`)
- Lockfile: present (`pnpm-lock.yaml`)

## Frameworks

**Core:**
- React 19 (`react`, `react-dom`) for UI rendering (`src/main.tsx`)
- TanStack Router (`@tanstack/react-router`) for route tree and app routing (`src/main.tsx`, `src/routes/`)
- Nitro via `vite-plugin-with-nitro` for server runtime and API endpoints (`vite.config.ts`, `nitro.config.ts`, `server/api/*`)
- H3 event handlers for API layer (`server/api/*.ts`)

**Testing:**
- Vitest 4 (`vitest`) for Node-based tests (`vitest.config.ts`, `test/common.test.ts`, `server/utils/date.test.ts`)

**Build/Dev:**
- Vite 7 (`vite`) as primary build/dev server (`vite.config.ts`)
- SWC React plugin (`@vitejs/plugin-react-swc`) for React transform (`vite.config.ts`)
- UnoCSS (`unocss`) for utility CSS generation (`vite.config.ts`, `uno.config.ts`)
- Vite PWA plugin (`vite-plugin-pwa`) for service worker and manifest generation (`pwa.config.ts`)
- Unimport auto-import plugin for shared hooks/utils (`vite.config.ts`, `vitest.config.ts`)
- Wrangler (`wrangler`) for Cloudflare Pages preview/deploy scripts (`package.json`)

## Key Dependencies

**Critical:**
- `@tanstack/react-router` / `@tanstack/router-plugin` - route generation/runtime (`src/routeTree.gen.ts`, `vite.config.ts`)
- `@tanstack/react-query` - client data fetching/state sync (`src/main.tsx`, `src/hooks/query.ts`)
- `h3` + Nitro auto-imports - server endpoint model (`server/api/*`, `vitest.config.ts`)
- `ofetch` - normalized HTTP client for upstream data collection and API calls (`server/utils/fetch.ts`, `src/utils/index.ts`)
- `db0` + `better-sqlite3` - persistence abstraction and local DB connector (`server/database/cache.ts`, `server/database/user.ts`, `nitro.config.ts`)
- `jose` - JWT signing/verification for auth (`server/api/oauth/github.ts`, `server/middleware/auth.ts`)
- `zod` - MCP tool input schema validation (`server/mcp/server.ts`)

**Infrastructure:**
- `@modelcontextprotocol/sdk` - hosted MCP endpoint/tooling (`server/api/mcp.post.ts`, `server/mcp/server.ts`)
- `cheerio`, `fast-xml-parser`, `iconv-lite` - scraping/feed parsing for source adapters (`server/sources/*`, `server/utils/rss2json.ts`)
- `consola` - server-side structured logging (`server/utils/logger.ts`)

## Configuration

**Environment:**
- Put server env values in `.env.server`; Vite explicitly loads this file at startup (`vite.config.ts`)
- Use sample variable names from `example.env.server`: `G_CLIENT_ID`, `G_CLIENT_SECRET`, `JWT_SECRET`, `INIT_TABLE`, `ENABLE_CACHE`, `PRODUCTHUNT_API_TOKEN`
- Login-sensitive routes require `JWT_SECRET`, `G_CLIENT_ID`, and `G_CLIENT_SECRET`; otherwise login endpoints are disabled (`server/middleware/auth.ts`)

**Build:**
- Frontend+server build: `pnpm run build` runs `presource` then Vite build (`package.json`)
- Source metadata generation: `tsx ./scripts/favicon.ts && tsx ./scripts/source.ts` (`package.json`, `scripts/`)
- Type checks split across app and node configs (`tsconfig.app.json`, `tsconfig.node.json`)
- Nitro DB/runtime behavior configured centrally in `nitro.config.ts`

## Platform Requirements

**Development:**
- Node.js >= 20 with Corepack/pnpm (`README.md`)
- `.env.server` configured when enabling login, JWT, cache tuning, or Product Hunt source (`example.env.server`)
- Optional Cloudflare local preview requires Wrangler (`package.json` scripts `preview`, `deploy`)

**Production:**
- Supported deploy targets:
  - Cloudflare Pages + D1 (`nitro.config.ts`, `example.wrangler.toml`)
  - Vercel Edge (database integration disabled by default) (`nitro.config.ts`)
  - Node server/container (`Dockerfile`, `docker-compose.yml`)
- Docker image artifact published via GitHub Actions (`.github/workflows/docker.yml`)

---

*Stack analysis: 2026-04-07*
