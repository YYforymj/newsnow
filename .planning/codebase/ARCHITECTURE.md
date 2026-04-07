# Architecture

**Analysis Date:** 2026-04-07

## Pattern Overview

**Overall:** Hybrid frontend-backend monorepo with file-based UI routing and file-based server API handlers.

**Key Characteristics:**
- React SPA UI in `src/` (TanStack Router + React Query + Jotai state) bootstrapped from `src/main.tsx`.
- Nitro server runtime in `server/` mounted through Vite plugin config in `nitro.config.ts`.
- Shared schema/config contract in `shared/` consumed by both frontend and server (`shared/types.ts`, `shared/metadata.ts`, `shared/sources.ts`).

## Layers

**Frontend App Layer:**
- Purpose: Render UI, manage client state, and trigger API fetch/refetch.
- Location: `src/`
- Contains: Router files in `src/routes/`, UI composition in `src/components/`, hooks in `src/hooks/`, atoms in `src/atoms/`.
- Depends on: `@tanstack/react-router`, `@tanstack/react-query`, `jotai`, `ofetch` via `src/utils/index.ts`, and shared contracts in `@shared/*`.
- Used by: Browser entrypoint `src/main.tsx`.

**Server API Layer:**
- Purpose: Serve aggregated news data, authentication endpoints, metadata sync, and MCP endpoint.
- Location: `server/api/`
- Contains: H3 event handlers by route file (`server/api/s/index.ts`, `server/api/me/sync.ts`, `server/api/oauth/github.ts`, `server/api/mcp.post.ts`).
- Depends on: Source getters (`server/getters.ts`), DB tables (`server/database/*.ts`), auth middleware (`server/middleware/auth.ts`), utilities (`server/utils/*`).
- Used by: Frontend `myFetch` calls from `src/utils/index.ts` (`baseURL: "/api"`), external OAuth callback, MCP clients.

**Source Integration Layer:**
- Purpose: Normalize many external source feeds into unified `NewsItem[]`.
- Location: `server/sources/`
- Contains: One module per source or source family (examples: `server/sources/github.ts`, `server/sources/cls/index.ts`, `server/sources/coolapk/index.ts`).
- Depends on: `defineSource` helpers in `server/utils/source.ts`, fetch wrappers in `server/utils/fetch.ts`, shared `NewsItem` type in `shared/types.ts`.
- Used by: Runtime source registry in `server/getters.ts` and `/api/s` handler `server/api/s/index.ts`.

**Persistence Layer:**
- Purpose: Cache source payloads and store per-user metadata.
- Location: `server/database/`
- Contains: `Cache` table abstraction in `server/database/cache.ts`, user table abstraction in `server/database/user.ts`.
- Depends on: Nitro DB via `useDatabase()`, connector selection in `nitro.config.ts`.
- Used by: `/api/s*` endpoints and `/api/me/sync` endpoint.

**Shared Contract Layer:**
- Purpose: Centralize source metadata, IDs, column metadata, and TS types used across runtimes.
- Location: `shared/`
- Contains: type declarations (`shared/types.ts`), source metadata graph (`shared/pre-sources.ts` -> generated `shared/sources.json` -> `shared/sources.ts`), column metadata (`shared/metadata.ts`), constants (`shared/consts.ts`).
- Depends on: Build-time generation script `scripts/source.ts`.
- Used by: Both `src/` and `server/` through alias `@shared`.

## Data Flow

**News Fetch Flow (UI card load/refetch):**

1. UI route (`src/routes/index.tsx` or `src/routes/c.$column.tsx`) renders `Column` (`src/components/column/index.tsx`) and DnD cards (`src/components/column/dnd.tsx` -> `src/components/column/card.tsx`).
2. Card query (`src/components/column/card.tsx`) calls frontend `myFetch` (`src/utils/index.ts`) to `/api/s?id=<source>` or `/api/s?id=<source>&latest`.
3. API handler `server/api/s/index.ts` validates source, checks cache via `getCacheTable()` (`server/database/cache.ts`), then either serves cache or calls source getter from `server/getters.ts`.
4. Getter dispatch maps source ID to a module in `server/sources/*`; module returns normalized `NewsItem[]`; cache may be updated.
5. Response (`SourceResponse`) returns to React Query cache and UI list render in `src/components/column/card.tsx`.

**User Sync Flow (metadata):**

1. Client updates atoms (`src/atoms/index.ts`, `src/atoms/primitiveMetadataAtom.ts`) and persists to localStorage.
2. `useSync` (`src/hooks/useSync.ts`) debounces manual updates and POSTs metadata to `/api/me/sync` with bearer JWT.
3. Middleware `server/middleware/auth.ts` validates JWT and injects `event.context.user` for `/api/me/*`.
4. `/api/me/sync` handler (`server/api/me/sync.ts`) reads/writes user row via `UserTable` (`server/database/user.ts`).
5. On app mount, `useSync` GETs `/api/me/sync`, preprocesses metadata, and hydrates client atom state.

**OAuth Login Flow (GitHub):**

1. Client triggers login (`src/hooks/useLogin.ts`) by redirecting to `/api/login` or direct GitHub URL from `/api/enable-login`.
2. `/api/login` (`server/api/login.ts`) redirects to GitHub OAuth authorize endpoint.
3. GitHub callback hits `/api/oauth/github` (`server/api/oauth/github.ts`), exchanges code for token, fetches user profile, writes user record, signs JWT.
4. Server redirects to `/` with JWT and user payload in query params; client storage is managed in hooks/atoms.

## Key Abstractions

**Source Getter Abstraction:**
- Purpose: Standardize scraping/API adapters into `SourceGetter` (`() => Promise<NewsItem[]>`).
- Examples: `server/utils/source.ts`, `server/sources/github.ts`, `server/sources/tencent.ts`.
- Pattern: Define with `defineSource(...)`; export either single getter or map keyed by source IDs.

**Runtime Getter Registry:**
- Purpose: Build dynamic source-id -> getter map at runtime.
- Examples: `server/getters.ts`, `tools/rollup-glob.ts`.
- Pattern: `glob:./sources/{*.ts,**/index.ts}` import expansion with typed entry iteration.

**Client Query + Local Cache Coordination:**
- Purpose: Balance UI responsiveness and refresh control.
- Examples: `src/components/column/card.tsx`, `src/hooks/query.ts`, `src/hooks/useRefetch.ts`, `src/utils/data.ts`.
- Pattern: React Query for network state, plus in-memory maps (`cacheSources`, `refetchSources`) for card-level cache/refetch behavior.

**Metadata Persistence Abstraction:**
- Purpose: Keep user source-order/focus configuration across sessions/devices.
- Examples: `src/atoms/primitiveMetadataAtom.ts`, `src/hooks/useSync.ts`, `server/api/me/sync.ts`, `server/database/user.ts`.
- Pattern: Jotai local persistence + optional server sync based on auth state.

## Entry Points

**Frontend Runtime Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loading `index.html`.
- Responsibilities: Create `QueryClient`, create TanStack Router with generated route tree `src/routeTree.gen.ts`, mount providers.

**Frontend Route Root Entry:**
- Location: `src/routes/__root.tsx`
- Triggers: Router root match.
- Responsibilities: Global layout, global hooks (`useOnReload`, `useSync`, `usePWA`), devtools mounting, shell components.

**Server Request Entry:**
- Location: `server/api/**/*.ts`
- Triggers: Nitro/H3 route matching from `/api/*`.
- Responsibilities: Handle endpoint-specific logic for news, login, sync, version, MCP.

**Server Middleware Entry:**
- Location: `server/middleware/auth.ts`
- Triggers: Each `/api` request.
- Responsibilities: Guard login-required routes and attach `event.context.user` from JWT.

**Build/Source Generation Entry:**
- Location: `scripts/source.ts`
- Triggers: `npm run presource` in `package.json` scripts.
- Responsibilities: Generate `shared/sources.json` and `shared/pinyin.json` from `shared/pre-sources.ts`.

## Error Handling

**Strategy:** Catch at API boundary, return H3 errors, and fallback to cached data where possible.

**Patterns:**
- API handlers wrap logic in `try/catch` and throw `createError` with status code (`server/api/s/index.ts`, `server/api/me/sync.ts`).
- Source fetch failures in `/api/s` fall back to cached payload if available (`server/api/s/index.ts`).

## Cross-Cutting Concerns

**Logging:** Shared `consola` logger in `server/utils/logger.ts`, used in DB and API modules.
**Validation:** Source ID guard and request checks in `server/api/s/index.ts`; metadata validation via `verifyPrimitiveMetadata` in `src/atoms/primitiveMetadataAtom.ts` and `server/api/me/sync.ts`.
**Authentication:** JWT verification middleware in `server/middleware/auth.ts`; OAuth + JWT issuance in `server/api/oauth/github.ts`.

---

*Architecture analysis: 2026-04-07*
