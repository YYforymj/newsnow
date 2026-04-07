# Codebase Structure

**Analysis Date:** 2026-04-07

## Directory Layout

```text
newsnow/
├── src/                    # Frontend React app (routes, components, hooks, atoms, styles)
├── server/                 # Nitro/H3 backend (API handlers, middleware, DB, source adapters)
├── shared/                 # Shared types/constants/metadata used by both runtimes
├── scripts/                # Build-time generators (source + favicon metadata)
├── tools/                  # Build helpers/plugins (Rollup glob helper)
├── test/                   # Cross-module tests
├── public/                 # Static assets served by frontend
├── .planning/codebase/     # Codebase mapping documents
├── vite.config.ts          # Frontend bundler and plugin config
├── nitro.config.ts         # Backend runtime/bundler config
└── package.json            # Scripts and dependency manifest
```

## Directory Purposes

**`src/`:**
- Purpose: Browser application UI and client-side state/data orchestration.
- Contains: Router files (`src/routes/*.tsx`), feature components (`src/components/**`), hooks (`src/hooks/*.ts`), Jotai atoms (`src/atoms/*.ts`), frontend utilities (`src/utils/*.ts`).
- Key files: `src/main.tsx`, `src/routes/__root.tsx`, `src/components/column/card.tsx`, `src/hooks/query.ts`.

**`server/`:**
- Purpose: API serving, source aggregation, auth, sync, and MCP endpoint.
- Contains: API handlers (`server/api/**`), middleware (`server/middleware/*.ts`), source adapters (`server/sources/**`), DB abstractions (`server/database/*.ts`), server utils (`server/utils/*.ts`).
- Key files: `server/api/s/index.ts`, `server/getters.ts`, `server/middleware/auth.ts`, `server/database/cache.ts`.

**`shared/`:**
- Purpose: Single shared contract for source metadata and type system.
- Contains: Types (`shared/types.ts`), constants (`shared/consts.ts`), source metadata model (`shared/pre-sources.ts`), generated source map (`shared/sources.json` via `scripts/source.ts`), derived metadata (`shared/metadata.ts`).
- Key files: `shared/types.ts`, `shared/metadata.ts`, `shared/pre-sources.ts`, `shared/sources.ts`.

**`scripts/`:**
- Purpose: Pre-build generation scripts run before dev/build.
- Contains: `scripts/source.ts`, `scripts/favicon.ts`.
- Key files: `scripts/source.ts`.

**`test/`:**
- Purpose: Top-level test cases that are not colocated under `src/` or `server/`.
- Contains: `test/common.test.ts`.
- Key files: `test/common.test.ts`.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Frontend runtime bootstrap.
- `src/routes/__root.tsx`: Root route shell and global hook initialization.
- `server/api/s/index.ts`: Primary news API endpoint.
- `server/middleware/auth.ts`: API middleware entry for auth/login gating.

**Configuration:**
- `package.json`: Script orchestration (`dev`, `build`, `presource`, `test`).
- `vite.config.ts`: Frontend plugins, aliases, and `.env.server` loading.
- `nitro.config.ts`: Server preset/db connector aliases and runtime imports.
- `tsconfig.base.json`: Shared strict TS settings.

**Core Logic:**
- `server/getters.ts`: Dynamic registration of all source getter modules.
- `server/sources/*.ts`: Source-specific data retrieval and normalization.
- `src/components/column/card.tsx`: Card fetch/render/refetch behavior.
- `src/atoms/primitiveMetadataAtom.ts`: Persistent client metadata model.

**Testing:**
- `test/common.test.ts`: General tests.
- `server/utils/date.test.ts`: Utility unit test in server layer.
- `vitest.config.ts`: Test runner setup.

## Naming Conventions

**Files:**
- Route files follow TanStack file-based naming: `src/routes/index.tsx`, `src/routes/c.$column.tsx`, `src/routes/__root.tsx`.
- API route files map to URL paths using Nitro conventions: `server/api/s/index.ts` -> `/api/s`, `server/api/s/entire.post.ts` -> `/api/s/entire` POST, `server/api/mcp.post.ts` -> `/api/mcp` POST.
- Source adapter files usually match source id or source family: `server/sources/github.ts`, `server/sources/coolapk/index.ts`.

**Directories:**
- Frontend grouped by responsibility: `src/components/`, `src/hooks/`, `src/atoms/`, `src/routes/`.
- Server grouped by runtime role: `server/api/`, `server/middleware/`, `server/database/`, `server/sources/`, `server/utils/`.

## Where to Add New Code

**New Feature:**
- Primary code: UI-first features under `src/components/` + `src/hooks/`; API-first features under `server/api/`.
- Tests: Add unit/integration tests in colocated `*.test.ts` near implementation (pattern example: `server/utils/date.test.ts`) or top-level `test/`.

**New Component/Module:**
- Implementation: Place visual components in `src/components/` by feature folder (`src/components/column/`, `src/components/common/`), and shared state in `src/atoms/`.

**Utilities:**
- Shared frontend/server type-safe helpers: `shared/type.util.ts`.
- Frontend-only helpers: `src/utils/`.
- Server-only helpers: `server/utils/`.

## Special Directories

**`shared/sources.json` and `shared/pinyin.json`:**
- Purpose: Generated source map and search index consumed by app/search UI.
- Generated: Yes (`scripts/source.ts` via `npm run presource`).
- Committed: Yes.

**`src/routeTree.gen.ts`:**
- Purpose: Generated TanStack Router route tree used by `src/main.tsx`.
- Generated: Yes (TanStack Router Vite plugin).
- Committed: Yes.

**`patches/`:**
- Purpose: Package patch files used by pnpm patchedDependencies.
- Generated: No (manually maintained patches).
- Committed: Yes.

---

*Structure analysis: 2026-04-07*
