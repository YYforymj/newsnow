# Testing Patterns

**Analysis Date:** 2026-04-07

## Test Framework

**Runner:**
- Vitest `^4.0.18` (`package.json`).
- Config: `vitest.config.ts`.

**Assertion Library:**
- Vitest built-in `expect` (used in `server/utils/date.test.ts`).

**Run Commands:**
```bash
pnpm test                         # Run all tests (script uses vitest config)
pnpm vitest -c vitest.config.ts --watch   # Watch mode
pnpm vitest -c vitest.config.ts --coverage # Coverage output (not scripted in package.json)
```

## Test File Organization

**Location:**
- Mixed location pattern:
- Co-located with source for server utility tests (`server/utils/date.test.ts`).
- Top-level test folder for generic scaffold tests (`test/common.test.ts`).
- `vitest.config.ts` includes `server/**/*.test.ts`, `shared/**/*.test.ts`, `test/**/*.test.ts`.

**Naming:**
- Use `*.test.ts` naming.
- No `*.spec.ts` files detected.

**Structure:**
```text
server/
  **/*.test.ts      # Source-adjacent tests
shared/
  **/*.test.ts      # Included by config (none currently detected)
test/
  **/*.test.ts      # Generic/integration smoke area
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from "vitest"

describe("feature name", () => {
  it("behavior case", () => {
    expect(actual).toBe(expected)
  })
})
```

**Patterns:**
- Setup pattern: inline constants and env setup inside `describe` (example: `Object.assign(process.env, { TZ: "UTC" })` in `server/utils/date.test.ts`).
- Teardown pattern: not standardized; no `afterEach`/`afterAll` usage detected.
- Assertion pattern: mostly `toBe` with deterministic numeric timestamps (example: `server/utils/date.test.ts`).

## Mocking

**Framework:** Vitest-compatible libs plus external utility `mockdate` (imported as `MockDate` in `server/utils/date.test.ts`).

**Patterns:**
```typescript
import MockDate from "mockdate"

const date = new Date()
MockDate.set(date)
expect(+new Date(parseRelativeDate("10秒前"))).toBe(+date - 10 * 1000)
```

**What to Mock:**
- Time-dependent logic should freeze clock/timezone deterministically (`MockDate` and `process.env.TZ`) as shown in `server/utils/date.test.ts`.

**What NOT to Mock:**
- Core pure parsing/transform logic should be asserted with real function outputs (pattern in `server/utils/date.test.ts`).
- No current pattern of mocking modules/network/database (`vi.mock` not detected in repository tests).

## Fixtures and Factories

**Test Data:**
```typescript
const second = 1000
const minute = 60 * second
const date = new Date()

expect(+new Date(parseRelativeDate("10分钟前"))).toBe(+date - 10 * minute)
```

**Location:**
- Fixtures are currently inline in test files (primary example: `server/utils/date.test.ts`).
- No shared fixture/factory directory detected under `test/` or `server/`.

## Coverage

**Requirements:** None enforced in scripts/config (`package.json` has no coverage script; `vitest.config.ts` has no coverage thresholds).

**View Coverage:**
```bash
pnpm vitest -c vitest.config.ts --coverage
```

## Test Types

**Unit Tests:**
- Primary test type.
- Focused deterministic utility tests for date parsing/conversion in `server/utils/date.test.ts`.

**Integration Tests:**
- Not detected as a maintained pattern.
- `test/common.test.ts` exists as placeholder only.

**E2E Tests:**
- Not used (no Playwright/Cypress/Webdriver config detected).

## Common Patterns

**Async Testing:**
```typescript
// Not established in current tests.
// Existing tests are synchronous assertions.
```

**Error Testing:**
```typescript
it("invalid", () => {
  expect(parseRelativeDate("RSSHub")).toBe("RSSHub")
})
```

---

*Testing analysis: 2026-04-07*
