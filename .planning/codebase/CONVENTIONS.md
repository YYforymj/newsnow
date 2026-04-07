# Coding Conventions

**Analysis Date:** 2026-04-07

## Naming Patterns

**Files:**
- Use `kebab-case` for most files (examples: `src/hooks/use-sync.ts` style is represented by existing `src/hooks/useSync.ts`, `server/utils/rss2json.ts`, `server/api/enable-login.ts`).
- Use route-special names for TanStack Router files in `src/routes/` (examples: `src/routes/__root.tsx`, `src/routes/c.$column.tsx`).
- Use `.test.ts` suffix for tests (examples: `server/utils/date.test.ts`, `test/common.test.ts`).

**Functions:**
- Use `camelCase` for functions and utilities (examples: `parseRelativeDate` in `server/utils/date.ts`, `verifyPrimitiveMetadata` in `shared/verify.ts`, `useSync` in `src/hooks/useSync.ts`).
- Use `useXxx` naming for React hooks in `src/hooks/` (examples: `useLogin`, `useSync`, `useToast`).

**Variables:**
- Use `camelCase` for local variables and params (examples: `queryClient` in `src/main.tsx`, `updatedTime` in `server/api/s/index.ts`).
- Use `UPPER_SNAKE_CASE` for process env keys when referenced (examples: `JWT_SECRET`, `G_CLIENT_ID`, `ENABLE_CACHE` in `server/middleware/auth.ts`, `server/database/cache.ts`).

**Types:**
- Use `PascalCase` for interfaces/types/classes (examples: `PrimitiveMetadata` in `shared/types.ts`, `UserTable` in `server/database/user.ts`, `CacheInfo` usage in `server/api/s/index.ts`).
- Prefix type-only imports with `import type` consistently (examples: `src/components/column/card.tsx`, `server/getters.ts`, `shared/types.ts`).

## Code Style

**Formatting:**
- Tool used: ESLint as formatter/fixer via `lint-staged` (`package.json` runs `eslint --fix` on staged files).
- Project style comes from shared config `@ourongxing/eslint-config` in `eslint.config.mjs`.
- Existing style patterns to follow:
- Double quotes for strings.
- Semicolons omitted.
- Trailing commas in multiline objects/calls.
- Compact arrow functions where readable.

**Linting:**
- Tool used: ESLint 9 (`package.json`, `eslint.config.mjs`).
- Key rules are inherited from `ourongxing({ type: "app" })` plus React rules via `react({ files: ["src/**"] })` in `eslint.config.mjs`.
- Generated and asset-like paths are ignored by lint (`src/routeTree.gen.ts`, `imports.app.d.ts`, `public/`, `.vscode`, `**/*.json`).

## Import Organization

**Order:**
1. Node built-ins first when used (examples: `import process from "node:process"` in `server/middleware/auth.ts`, `import { join } from "node:path"` in `vite.config.ts`).
2. External packages next (examples: `@tanstack/*`, `react-use`, `zod`, `ofetch`).
3. Internal aliases and relative imports last (examples: `~/atoms`, `@shared/types`, `#/database/cache`, `./useLogin`).

**Path Aliases:**
- Frontend alias `~/*` -> `src/*` (`tsconfig.app.json`, used in `src/routes/__root.tsx`).
- Shared alias `@shared/*` -> `shared/*` (`tsconfig.app.json`, `tsconfig.node.json`).
- Server alias `#/*` -> `server/*` (`tsconfig.node.json`, used in `server/api/s/index.ts`).
- Auto-imports are enabled (no explicit imports for many symbols) via `unimport` in `vite.config.ts` and `vitest.config.ts`.

## Error Handling

**Patterns:**
- API handlers wrap core logic in `try/catch`, log, then throw `createError` (example: `server/api/s/index.ts`).
- For optional or best-effort paths, catch and return `undefined`/no-op instead of throwing (examples: `server/database/cache.ts` `getCacheTable`, `server/api/s/entire.post.ts`).
- Client-side request handlers often gate on `statusCode` and trigger auth recovery (example: `src/hooks/useSync.ts`).
- Validation errors are fail-fast via `zod.parse` (example: `shared/verify.ts`).

## Logging

**Framework:** `consola` via centralized logger in `server/utils/logger.ts`.

**Patterns:**
- Use `logger.success/info/warn/error` on server/database flows (examples: `server/database/user.ts`, `server/database/cache.ts`, `server/middleware/auth.ts`).
- Some modules still use raw `console.error`/`console.warn` (examples: `server/mcp/server.ts`, `server/api/mcp.post.ts`, `server/sources/freebuf.ts`, `src/components/column/card.tsx`).
- For new server code, prefer `logger` over direct `console.*` for consistency.

## Comments

**When to Comment:**
- Comment non-obvious platform/runtime quirks and edge cases (examples in `server/api/s/index.ts`, `server/api/oauth/github.ts`, `server/utils/date.ts`).
- Keep comments concise and context-specific; avoid obvious line-by-line comments.

**JSDoc/TSDoc:**
- Sparse but present for complex utilities and schema fields (examples: block comments in `server/utils/date.ts`, interface field comments in `shared/types.ts`).
- No strict requirement detected for full JSDoc on every exported function.

## Function Design

**Size:** No enforced size limit; utility and handler functions vary from short to large (example of large parser logic in `server/utils/date.ts`).

**Parameters:** Prefer typed parameters on exported APIs/classes (examples: `server/database/user.ts`, `shared/utils.ts`), but `any` appears in boundary/error-prone areas (examples: `src/hooks/useSync.ts`, `src/utils/index.ts`).

**Return Values:**
- Return explicit object shapes for API responses (examples: `server/api/latest.ts`, `server/api/s/index.ts`).
- Use early returns for invalid/empty cases (examples: `server/utils/rss2json.ts`, `src/hooks/query.ts`).

## Module Design

**Exports:**
- Prefer named exports for reusable utilities/components/hooks (examples: `src/hooks/query.ts`, `shared/utils.ts`, `server/utils/logger.ts`).
- Use default export for route/API entry modules (examples: `server/api/*.ts`, `src/routes/*.tsx` route object export plus local component functions).

**Barrel Files:**
- Barrel pattern used selectively for cohesion points (examples: `src/atoms/index.ts`, component folder `index.tsx` files such as `src/components/header/index.tsx`, `src/components/column/index.tsx`).
- Prefer adding to existing local barrels when extending that area.

---

*Convention analysis: 2026-04-07*
