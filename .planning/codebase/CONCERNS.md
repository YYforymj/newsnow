# Codebase Concerns

**Analysis Date:** 2026-04-07

## Tech Debt

**Authentication/session flow spans client storage, URL params, and server middleware:**
- Issue: OAuth login stores JWT in query params and browser storage instead of server-managed cookie sessions.
- Files: `server/api/login.ts`, `server/api/oauth/github.ts`, `server/middleware/auth.ts`, `src/hooks/useLogin.ts`, `src/hooks/useSync.ts`, `src/components/column/card.tsx`
- Impact: Session handling is hard to reason about and increases accidental token exposure risk.
- Fix approach: Move to HttpOnly secure cookie sessions, keep auth transport in one place, and remove JWT usage from URL/localStorage.

**Source registry and adapters are highly coupled and mostly untyped:**
- Issue: Source metadata and fetch logic are spread across a large static registry plus 46 adapters with repeated parsing logic and weak typing.
- Files: `shared/pre-sources.ts`, `shared/sources.ts`, `shared/sources.json`, `server/getters.ts`, `server/sources/*.ts`
- Impact: Adding/changing a source is error-prone and regressions are hard to isolate.
- Fix approach: Define a strict adapter contract, centralize parse/fetch helpers, and split source registry by domain.

**Type-safety bypasses in core paths:**
- Issue: Extensive `any` and `@ts-expect-error` in request parsing, RSS conversion, and metadata operations.
- Files: `server/utils/rss2json.ts`, `server/database/cache.ts`, `shared/verify.ts`, `shared/metadata.ts`, `src/components/common/search-bar/index.tsx`, `server/sources/*.ts`
- Impact: Runtime failures are likely to bypass compile-time checks.
- Fix approach: Replace `any` with Zod-validated DTOs and remove suppression comments by tightening interfaces.

**Error handling policy is inconsistent:**
- Issue: Some APIs throw structured errors while others swallow exceptions and return `undefined`.
- Files: `server/api/s/index.ts`, `server/api/s/entire.post.ts`, `server/api/me/sync.ts`, `server/api/mcp.post.ts`
- Impact: Clients cannot distinguish empty data from failures; observability is weak.
- Fix approach: Standardize error responses and never silently catch unless returning explicit fallback metadata.

## Known Bugs

**MCP tool ignores sanitized count value:**
- Symptoms: Invalid `count` input can produce empty/incorrect slices because sanitized `n` is computed but not used.
- Files: `server/mcp/server.ts`
- Trigger: Call MCP tool `get_hotest_latest_news` with non-numeric `count`.
- Workaround: Pass numeric count values only.

**Relative-date parser has incorrect English alias for "tomorrow":**
- Symptoms: Regex for `明天` branch includes `yesterday` pattern.
- Files: `server/utils/date.ts`
- Trigger: Parse English tomorrow-like values relying on keyword branch.
- Workaround: Prefer explicit timestamps or supported Chinese relative formats.

**Silent failure on entire-cache endpoint:**
- Symptoms: Endpoint may return no response body when exceptions occur.
- Files: `server/api/s/entire.post.ts`
- Trigger: Invalid body shape, DB init failure, or runtime exception inside handler.
- Workaround: Client retries with single-source endpoint `/api/s`.

**User profile endpoint is placeholder-only:**
- Symptoms: `/api/me` returns static `{ hello: "world" }` rather than user/session payload.
- Files: `server/api/me/index.ts`
- Trigger: Any call to `/api/me`.
- Workaround: Use `/api/me/sync` and JWT-authenticated flows for metadata only.

## Security Considerations

**OAuth flow lacks CSRF state validation:**
- Risk: Authorization code flow can be tampered with across tabs/sessions.
- Files: `server/api/login.ts`, `server/api/oauth/github.ts`
- Current mitigation: None detected.
- Recommendations: Add per-request `state` generation, persistence, and callback verification.

**JWT is exposed via URL query and localStorage:**
- Risk: Token leakage via browser history, logs, referrers, and XSS surfaces.
- Files: `server/api/oauth/github.ts`, `src/hooks/useLogin.ts`, `src/hooks/useSync.ts`, `src/components/column/card.tsx`
- Current mitigation: Token verification in `server/middleware/auth.ts`.
- Recommendations: Issue HttpOnly `Secure` cookies and remove JWT from query string/localStorage.

**Reverse-tabnabbing risk on some external links:**
- Risk: `target="_blank"` links without `rel="noopener noreferrer"` can access opener context.
- Files: `src/components/footer.tsx`, `src/components/header/index.tsx`, `src/components/column/card.tsx`
- Current mitigation: Some links already set `rel` (not consistent).
- Recommendations: Enforce lint rule or shared link component requiring `rel`.

**Dynamic SQL string assembly in cache bulk read:**
- Risk: Query building pattern can become injectable if source validation changes.
- Files: `server/database/cache.ts`
- Current mitigation: IDs currently filtered against `sources` before call in `server/api/s/entire.post.ts`.
- Recommendations: Use parameterized `IN (?, ?, ...)` query generation.

## Performance Bottlenecks

**Table initialization executed in request paths:**
- Problem: `init()` checks run during hot API requests.
- Files: `server/database/cache.ts`, `server/database/user.ts`, `server/api/me/sync.ts`, `server/api/oauth/github.ts`
- Cause: Runtime schema init in handlers instead of startup/migration phase.
- Improvement path: Move schema migration/init to startup or deploy-time migration scripts.

**Source fetchers depend on brittle full-page parsing:**
- Problem: Frequent HTML fetch + regex/cheerio parsing across many providers.
- Files: `server/sources/*.ts` (examples: `server/sources/baidu.ts`, `server/sources/kuaishou.ts`, `server/sources/freebuf.ts`)
- Cause: No provider abstraction for robust API-first ingestion.
- Improvement path: Prefer official APIs/RSS where possible; add parser guardrails and circuit breakers.

**Cache bulk query scales poorly with long OR chains:**
- Problem: `id='a' or id='b' ...` query grows linearly and degrades with larger request batches.
- Files: `server/database/cache.ts`
- Cause: String-concatenated predicate construction.
- Improvement path: Use parameterized `IN` clauses and cap batch size in `server/api/s/entire.post.ts`.

## Fragile Areas

**Scraper parsing assumptions can hard-fail:**
- Files: `server/sources/baidu.ts`, `server/sources/ifeng.ts`, `server/sources/kuaishou.ts`, `server/sources/jin10.ts`
- Why fragile: Regex matches and JSON extraction rely on exact upstream HTML/script layout.
- Safe modification: Wrap each parser stage with explicit guard checks and source-specific fallback handling.
- Test coverage: No source-adapter tests detected for these parsers.

**Large generated source metadata is single-point edit surface:**
- Files: `shared/pre-sources.ts`, `shared/sources.json`, `scripts/source.ts`
- Why fragile: Changes in source generation may break IDs, redirects, and metadata assumptions globally.
- Safe modification: Add generation validation tests and schema checks before writing `shared/sources.json`.
- Test coverage: No tests detected for source generation pipeline.

**MCP server lifecycle is request-coupled:**
- Files: `server/api/mcp.post.ts`, `server/mcp/server.ts`
- Why fragile: Server/transport setup and teardown on each request increases failure surface under concurrent load.
- Safe modification: Reuse server instance where supported and add explicit cleanup/error telemetry.
- Test coverage: No tests detected for MCP endpoint/tool behavior.

## Scaling Limits

**Single local/edge DB for both user state and cache blobs:**
- Current capacity: One logical DB with JSON payload rows (`cache.data`, `user.data`).
- Limit: Growth in users/source payload size increases DB latency and write contention.
- Scaling path: Separate cache/user stores, add TTL eviction strategy, and externalize hot cache to KV/Redis-like store.

**External provider dependency fan-out without backpressure:**
- Current capacity: 46 source adapters in `server/sources/`.
- Limit: Upstream outages/layout changes can degrade freshness and response reliability.
- Scaling path: Add per-source health scoring, backoff, stale-if-error policy, and source-level observability.

## Dependencies at Risk

**Patched upstream `dayjs` behavior:**
- Risk: Custom patch can drift from upstream and break with minor version changes.
- Impact: Date parsing/relative duration behavior becomes difficult to upgrade safely.
- Migration plan: Isolate patched behavior into local wrapper utilities and remove package patch where possible.
- Files: `patches/dayjs.patch`, `package.json`, `server/utils/date.ts`

**Experimental Nitro database mode in production path:**
- Risk: Experimental features may change behavior across runtime targets.
- Impact: Runtime DB behavior divergence between local/node/cloud presets.
- Migration plan: Pin tested versions, add integration tests per deployment target, and evaluate non-experimental connector path.
- Files: `nitro.config.ts`

## Missing Critical Features

**No anti-abuse controls on public data endpoints:**
- Problem: `/api/s`, `/api/s/entire`, and `/api/mcp` can be hit without rate limiting.
- Blocks: Predictable performance under scraping/automation spikes.
- Files: `server/api/s/index.ts`, `server/api/s/entire.post.ts`, `server/api/mcp.post.ts`

**No structured health/metrics endpoint:**
- Problem: No explicit endpoint for source health, cache hit rate, or parser failure rates.
- Blocks: Fast incident response when providers fail.
- Files: `server/` (no health/metrics route detected in `server/api/`)

## Test Coverage Gaps

**API and auth flow untested:**
- What's not tested: OAuth login callback, JWT middleware behavior, sync endpoint error cases.
- Files: `server/api/oauth/github.ts`, `server/middleware/auth.ts`, `server/api/me/sync.ts`
- Risk: Auth regressions or token-handling vulnerabilities can ship unnoticed.
- Priority: High

**Data source adapters untested:**
- What's not tested: Parser resilience and schema assumptions for upstream HTML/API changes.
- Files: `server/sources/*.ts`
- Risk: Silent data loss or repeated runtime errors when source providers change markup.
- Priority: High

**Cache/database behavior minimally tested:**
- What's not tested: `Cache.getEntire`, cache TTL semantics, DB init/availability failure paths.
- Files: `server/database/cache.ts`, `server/api/s/index.ts`, `server/api/s/entire.post.ts`
- Risk: Incorrect stale-data behavior and unpredictable response contract.
- Priority: Medium

**Frontend sync and storage flows untested:**
- What's not tested: local metadata precedence, JWT absence/expiry behavior, logout storage side effects.
- Files: `src/hooks/useSync.ts`, `src/hooks/useLogin.ts`, `src/atoms/primitiveMetadataAtom.ts`
- Risk: User settings loss and inconsistent sync behavior.
- Priority: Medium

---

*Concerns audit: 2026-04-07*
