# Code Quality & Architecture Review — CaféMeeple

**Reviewer:** Principal Software Engineer (automated review)
**Date:** 2025-07-17
**Codebase:** `05-cafemeeple/` — Next.js 16 + React 19 + better-sqlite3 + Tailwind 4
**Scope:** All 40 TypeScript/TSX source files (~5,700 LOC excluding seed data)

---

## Executive Summary

| Dimension              | Rating       |
|------------------------|--------------|
| Overall Quality Score  | **C+**       |
| Architecture Health    | **Fair**     |
| Maintainability Index  | **Medium**   |
| Technical Debt         | **Medium**   |
| Test Coverage          | **None (0%)**|

CaféMeeple is a well-structured prototype with good UI/UX polish, strong accessibility practices, and reasonable error handling. However, it suffers from **zero test coverage**, **god-component admin pages** (450–632 lines each), **triplicated business logic**, **no shared type definitions**, and **no authentication whatsoever** on an admin panel managing financial data. The codebase is solidly built for a demo but needs significant refactoring before production.

---

## P0 — Critical (Must Address Before Production)

### P0-1: Zero Test Coverage

**Files:** Entire codebase
**Impact:** No regression safety net; refactoring is high-risk

The project has **zero test files** — no unit tests, integration tests, or e2e tests. For an application managing sessions, financial charges, and inventory, this is the single highest-risk gap.

**Fix:**
1. Add `vitest` (or `jest`) and `@testing-library/react` to devDependencies.
2. Write unit tests for all shared business logic (e.g., `conditionScoreForLabel`, billing calculations).
3. Write API route integration tests using `supertest` or Next.js test helpers.
4. Add e2e smoke tests with Playwright for critical flows (game CRUD, session lifecycle, checkout/return).
5. Target ≥70% coverage for `lib/` and `app/api/` within the first sprint.

---

### P0-2: No Authentication or Authorization

**Files:** `app/admin/layout.tsx`, all `app/api/*` routes
**Impact:** Any user can access admin panel, modify data, delete records, view revenue

Every API route and the entire `/admin` UI are publicly accessible. There is no auth middleware, session token, or even a basic password gate. The dashboard exposes revenue figures and the API allows destructive operations (DELETE games, end sessions with charges).

**Fix:**
1. Add NextAuth.js (or a lightweight auth middleware) with at least email/password or OAuth.
2. Protect all `/api/*` routes with a server-side auth check; return 401/403 for unauthenticated requests.
3. Gate the `/admin` layout behind a session check with redirect to login.
4. For the demo, consider at minimum a shared secret / basic auth gate.

---

### P0-3: SQL Injection Surface in Schema Migration

**File:** `lib/db.ts:179`
**Code:**
```ts
const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
```

`tableName` is interpolated directly into the SQL string without parameterization. While currently only called with hardcoded strings (`"games"`, `"sessions"`), this is a dangerous pattern that can become exploitable if the function signature is reused. Line 181 has the same issue with `ALTER TABLE`.

**Fix:**
Validate `tableName` against an allowlist of known table names:
```ts
const KNOWN_TABLES = new Set(["games", "sessions", "tables", "reservations", "events", "rsvps", "game_checkouts"]);

function addColumnIfMissing(database: Database.Database, tableName: string, columnName: string, definition: string) {
  if (!KNOWN_TABLES.has(tableName)) throw new Error(`Unknown table: ${tableName}`);
  if (!/^[a-z_]+$/.test(columnName)) throw new Error(`Invalid column name: ${columnName}`);
  // ... proceed
}
```

---

### P0-4: Database File Committed to Repository

**File:** `cafemeeple.db`, `cafemeeple.db-shm`, `cafemeeple.db-wal`
**Impact:** Binary database files in Git bloat the repo and may contain sensitive session/reservation data

SQLite database files and WAL journals are present in the repository root and appear to be tracked.

**Fix:**
Add to `.gitignore`:
```
*.db
*.db-shm
*.db-wal
```
Then `git rm --cached cafemeeple.db*` and commit.

---

## P1 — High Priority (Address in Next Sprint)

### P1-1: God Components — Admin Pages Exceed 500+ Lines

| File | Lines | `useState` calls | Responsibilities |
|------|-------|-------------------|------------------|
| `app/admin/games/page.tsx` | **632** | 18 | Listing, filtering, grid/list views, add modal, edit modal, delete confirm, form validation |
| `app/admin/reservations/page.tsx` | **558** | 15 | Listing, date filtering, add/edit modal, delete confirm, status management |
| `app/admin/events/page.tsx` | **526** | 17 | Listing, CRUD modals, RSVP viewer, RSVP creation, delete confirm |
| `app/admin/tables/page.tsx` | **517** | 12 | Floor map, table list, check-in modal, session end confirm, billing display |
| `app/admin/checkout/page.tsx` | **447** | 15 | Session selector, game search, checkout action, return modal, history tab |

Each page is a **monolithic component** mixing data fetching, state management, business logic, form handling, and complex JSX rendering. This violates SRP and makes every page extremely difficult to test, review, or modify independently.

**Fix — Extract into composable modules:**
```
app/admin/games/
  page.tsx              # Orchestrator (~80 lines)
  components/
    GameGrid.tsx
    GameListTable.tsx
    GameFilterBar.tsx
    GameModal.tsx        # Already partially extracted, move to own file
  hooks/
    useGames.ts          # Data fetching + filter state
  types.ts               # Game interface
```
Apply the same pattern to all 5 admin pages.

---

### P1-2: Triplicated `conditionScoreForLabel` Function

**Files:**
- `app/api/games/route.ts:3–17`
- `app/api/games/[id]/route.ts:21–35`
- `app/api/checkout/[id]/return/route.ts:3–17`

The exact same 15-line switch statement is copy-pasted across 3 files. This is a textbook DRY violation — if condition labels change, all three copies must be updated in sync.

**Fix:**
Create `lib/game-utils.ts`:
```ts
export const CONDITION_LABELS = ["Excellent", "Good", "Fair", "Worn", "Needs Replacement"] as const;
export type ConditionLabel = typeof CONDITION_LABELS[number];

const SCORE_MAP: Record<ConditionLabel, number> = {
  "Excellent": 5, "Good": 4, "Fair": 3, "Worn": 2, "Needs Replacement": 1,
};

export function conditionScoreForLabel(condition: string): number {
  return SCORE_MAP[condition as ConditionLabel] ?? 4;
}
```

---

### P1-3: No Shared Type Definitions

**Impact:** Interfaces like `Game`, `Session`, `Table`, `Reservation`, `EventItem` are redefined independently in each admin page and in API routes. The `Game` interface alone appears in 3+ files with slightly different shapes.

**Fix:**
Create `lib/types.ts` with canonical domain types:
```ts
export interface Game { id: number; title: string; /* ... */ }
export interface Table { id: number; name: string; /* ... */ }
export interface Session { id: number; table_id: number; /* ... */ }
export interface Reservation { id: number; guest_name: string; /* ... */ }
export interface EventItem { id: number; title: string; /* ... */ }
export interface Checkout { id: number; session_id: number; /* ... */ }
```
Import everywhere instead of redeclaring.

---

### P1-4: Data Fetching Logic Duplicated Across All Pages

Every admin page repeats the same pattern (~30 lines each):
```ts
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
  let cancelled = false;
  async function load() { /* fetch, setLoading, setError, cancelled check */ }
  load();
  return () => { cancelled = true; };
}, [refreshKey, ...deps]);
```

This is repeated verbatim in all 6 admin pages. The cancellation logic, loading/error state, and refresh mechanism are identical.

**Fix:**
Extract a custom hook:
```ts
// hooks/useFetch.ts
export function useFetch<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);
  // ... shared fetch logic
  return { data, loading, error, refresh };
}
```

---

### P1-5: Checkout/Return Lacks Transaction Safety

**File:** `app/api/checkout/route.ts:64–69`, `app/api/checkout/[id]/return/route.ts:45–74`

The checkout flow performs two separate writes (INSERT checkout + UPDATE game inventory) without wrapping them in a SQLite transaction. If the process crashes between the two statements, inventory counts will be inconsistent.

Similarly, the return flow performs **three separate writes** (UPDATE checkout, UPDATE game condition, UPDATE game replacement flag) non-atomically.

**Fix:**
```ts
const checkout = db.transaction(() => {
  const result = db.prepare(`INSERT INTO game_checkouts ...`).run(session_id, game_id);
  db.prepare(`UPDATE games SET copies_available = copies_available - 1 ...`).run(game_id);
  return result;
})();
```
Apply the same pattern to `sessions/route.ts` POST (insert session + update table status) and the return endpoint.

---

### P1-6: `needs_replacement` Flag Updated via Redundant Double-Write

**File:** `app/api/games/[id]/route.ts:116–130`

After updating a game, the code runs a **second separate UPDATE** to recompute `needs_replacement`. This second query includes a correlated subquery `SELECT COUNT(*) FROM game_checkouts`. The same pattern appears in `checkout/[id]/return/route.ts:62–74`.

**Fix:** Compute `needs_replacement` in the first UPDATE or use a SQLite generated column / trigger. At minimum, wrap both UPDATEs in a transaction.

---

### P1-7: Dashboard Revenue Calculation Uses Hardcoded Magic Numbers

**File:** `app/api/dashboard/route.ts:51–63`

```ts
SELECT 'Food & Beverage' as category, ROUND(COALESCE(SUM(party_size * 11.5), 0), 2) as value
...
SELECT 'Retail' as category, ROUND(COALESCE(COUNT(*) * 4.25, 0), 2) as value
...
COALESCE(SUM(r.party_size) * 9.5, 0)
```

Magic numbers `11.5`, `4.25`, `9.5` represent per-person F&B spend, retail revenue per checkout, and event ticket price. These are hardcoded in SQL with no documentation, configuration, or named constants.

**Fix:**
Extract to configuration constants:
```ts
const DASHBOARD_ESTIMATES = {
  avgFoodBeveragePerPerson: 11.5,
  avgRetailPerCheckout: 4.25,
  avgEventTicketPerPerson: 9.5,
} as const;
```

---

### P1-8: Module-Level Mutable Singleton State

**File:** `lib/db.ts:9–10`

```ts
let db: Database.Database | null = null;
let seedChecked = false;
```

Module-level mutable state creates an implicit singleton that is:
- Not testable (can't inject a test database)
- Not safe across hot-reload in development (HMR can reset module state inconsistently)
- Impossible to run parallel test suites against different databases

**Fix:**
Use Next.js `globalThis` pattern for dev HMR safety:
```ts
const globalForDb = globalThis as typeof globalThis & { __cafemeeple_db?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.__cafemeeple_db) {
    globalForDb.__cafemeeple_db = new Database(DB_PATH);
    // ...
  }
  return globalForDb.__cafemeeple_db;
}
```
For testability, accept an optional `dbPath` parameter.

---

## P2 — Medium Priority (Address When Touching These Files)

### P2-1: Seed File is 430 Lines of Hardcoded Data

**File:** `lib/seed.ts` (430 lines)

The seed file contains 100 board game entries as a giant inline array. This should be externalized to a JSON fixture.

**Fix:** Move to `lib/fixtures/seed-games.json` and import it. The seed function itself should be under 30 lines.

---

### P2-2: API Input Validation is Minimal

**Files:** All `app/api/*/route.ts` POST/PUT handlers

Validation is limited to checking if a single required field is present (e.g., `if (!title)`). There is no:
- Type checking on numeric fields (party_size could be a string)
- Range validation (complexity 0–5, party_size > 0)
- Email format validation on `guest_email`
- Date format validation on `reservation_date`
- Length limits on text fields

**Fix:** Add a lightweight validation layer. Options:
- `zod` schemas per endpoint (recommended)
- A shared `validate()` utility with field rules
```ts
const CreateGameSchema = z.object({
  title: z.string().min(1).max(200),
  min_players: z.number().int().min(1).max(20),
  // ...
});
```

---

### P2-3: Inconsistent Error Handling Pattern

Every API route wraps the entire handler in try/catch and returns the same generic error:
```ts
catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return Response.json({ error: message }, { status: 500 });
}
```

This is consistent but has issues:
- Raw error messages may leak internal details (SQL errors, stack traces)
- No structured error codes for client-side handling
- No logging (errors are silently swallowed)

**Fix:** Create middleware or utility:
```ts
// lib/api-utils.ts
export function apiHandler(fn: (req: Request, ctx?: any) => Promise<Response>) {
  return async (req: Request, ctx?: any) => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      console.error("[API Error]", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return Response.json({ error: message, code: "INTERNAL_ERROR" }, { status: 500 });
    }
  };
}
```

---

### P2-4: `CONDITIONS` Array Duplicated in Frontend

**Files:**
- `app/admin/games/page.tsx:34`
- `app/admin/checkout/page.tsx:39`

The `CONDITIONS` array `["Excellent", "Good", "Fair", "Worn", "Needs Replacement"]` is defined independently in both files. It should also match the backend `conditionScoreForLabel` mapping.

**Fix:** Move to `lib/constants.ts` and import in both frontend and backend files.

---

### P2-5: `Game` Interface Defined Differently Across Files

The `Game` interface in `app/admin/games/page.tsx` has 16 fields including `checkout_count` and `last_checked_out_at`. The `Game` interface in `app/admin/checkout/page.tsx` has only 4 fields (`id`, `title`, `category`, `copies_available`). The `GameRow` interface in `app/api/games/[id]/route.ts` has yet another shape.

While some field differences are intentional (different API responses), the lack of a canonical type makes it easy for frontend and backend to drift apart silently.

**Fix:** Define base types in `lib/types.ts` and use `Pick<>` / `Omit<>` for view-specific subsets.

---

### P2-6: No API Response Type Safety

**Files:** All admin pages

API responses are consumed with `await response.json()` and cast with `as Game[]` or `as DashboardData`. There is no runtime validation that the API actually returned the expected shape.

**Fix:** Use `zod` schemas to parse API responses:
```ts
const games = GameArraySchema.parse(await response.json());
```

---

### P2-7: Inline Tailwind Classes Cause Extreme Line Lengths

**Files:** All component and admin page files

Many JSX elements have 150+ character `className` strings:
```tsx
className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
  isActive ? "bg-sidebar-active text-white" : "text-sidebar-text hover:bg-white/5 hover:text-white"
}`}
```

**Fix:** Extract repeated class patterns into Tailwind `@apply` utilities or use `clsx`/`cn` helper with named style objects for complex conditional classes.

---

### P2-8: Toast ID Counter Uses Module-Level `let nextId`

**File:** `components/Toast.tsx:20`

```ts
let nextId = 0;
```

Module-level counter will reset on HMR and could theoretically collide across SSR/CSR boundaries (though `"use client"` mitigates SSR risk).

**Fix:** Use `useRef` inside `ToastProvider` or `crypto.randomUUID()`.

---

### P2-9: Games DELETE Does Not Check for Active Checkouts

**File:** `app/api/games/[id]/route.ts:140–156`

Deleting a game does not verify whether it has active (unreturned) checkouts. This would create orphaned `game_checkouts` rows and inconsistent inventory.

**Fix:**
```ts
const activeCheckouts = db.prepare(
  "SELECT COUNT(*) as count FROM game_checkouts WHERE game_id = ? AND returned_at IS NULL"
).get(id) as { count: number };

if (activeCheckouts.count > 0) {
  return Response.json({ error: "Cannot delete: game has active checkouts" }, { status: 409 });
}
```

---

### P2-10: Session End Logic Missing from API

The sessions API has POST (create) but no PATCH/PUT endpoint to end a session (set `status = 'completed'`, calculate `total_charge`, free the table). The tables page likely handles this client-side, but there should be a dedicated endpoint.

**Fix:** Add `app/api/sessions/[id]/route.ts` with PUT for ending sessions and PATCH for updates.

---

### P2-11: Date Handling Inconsistencies

**Files:** `app/api/dashboard/route.ts:6`, admin page date formatting

```ts
const today = new Date().toISOString().split("T")[0]; // Server-side
```

This uses the server's timezone, which may differ from the café's local timezone. SQLite's `date('now')` also uses UTC. Revenue and session queries could attribute sessions to the wrong day.

**Fix:** Accept timezone as configuration or use consistent UTC throughout with clear documentation.

---

## SOLID Violations Summary

| Principle | Violation | Location | Severity |
|-----------|-----------|----------|----------|
| **SRP** | Admin pages mix fetching, state, validation, UI rendering | All `app/admin/*/page.tsx` | High |
| **SRP** | `lib/db.ts` handles schema creation, migration, seeding, and connection management | `lib/db.ts` | Medium |
| **OCP** | Adding a new condition label requires editing 3 separate switch statements | `conditionScoreForLabel` × 3 | Medium |
| **DIP** | API routes directly instantiate `getDb()` singleton — no injection seam | All API routes | Medium |
| **DIP** | Admin pages hardcode `fetch()` URLs — no API client abstraction | All admin pages | Low |
| **ISP** | `Game` interface in games page has 16 fields; checkout page only needs 4 | Multiple files | Low |

---

## Code Smell Inventory

| Category | Smell | Location | Severity |
|----------|-------|----------|----------|
| Structural | God Component (632 lines) | `admin/games/page.tsx` | 🔴 High |
| Structural | God Component (558 lines) | `admin/reservations/page.tsx` | 🔴 High |
| Structural | God Component (526 lines) | `admin/events/page.tsx` | 🔴 High |
| Structural | God Component (517 lines) | `admin/tables/page.tsx` | 🔴 High |
| Duplication | Copy-paste function (3×) | `conditionScoreForLabel` | 🟡 Medium |
| Duplication | Identical fetch/loading pattern (6×) | All admin pages | 🟡 Medium |
| Duplication | `CONDITIONS` array (2×) | games + checkout pages | 🟢 Low |
| Naming | Generic variable names | `resRes`, `tablesRes` | 🟢 Low |
| Magic Values | Hardcoded revenue multipliers | `dashboard/route.ts:51–63` | 🟡 Medium |
| Data Clump | `loading`/`error`/`refreshKey` triple (6×) | All admin pages | 🟡 Medium |

---

## Positive Observations (Preserve These)

1. **Strong accessibility:** `aria-label`, `aria-current`, `aria-live`, `role="alert"`, `sr-only` text, focus-visible rings, and keyboard navigation are implemented throughout. The Modal has a proper focus trap.

2. **Good error UX:** Every page has loading states, error messages with retry buttons, empty states with actionable CTAs, and toast notifications.

3. **Clean component library:** `components/ui.tsx` provides well-typed, focused primitive components (`LoadingSpinner`, `EmptyState`, `ErrorMessage`, `StatCard`, `Badge`). These follow ISP well.

4. **Proper data fetching patterns:** useEffect cleanup with `cancelled` flag prevents state updates after unmount. Debounced search in games page prevents excessive API calls.

5. **SQLite best practices:** WAL mode, foreign keys enabled, proper indexes on frequently queried columns.

6. **Responsive design:** Mobile-first with sidebar collapse, responsive grids, and touch-friendly targets.

7. **TypeScript strict mode:** `tsconfig.json` has `"strict": true` and no `any` types anywhere in the codebase.

---

## Refactoring Roadmap

### Phase 1: Foundation (High Impact, Low Effort)
1. Add `.gitignore` entries for `*.db*` files
2. Extract `conditionScoreForLabel` to `lib/game-utils.ts`
3. Create `lib/types.ts` with shared domain interfaces
4. Extract `CONDITIONS`, `CATEGORIES`, `EVENT_TYPES` to `lib/constants.ts`
5. Add allowlist validation to `addColumnIfMissing`

### Phase 2: Architecture (High Impact, High Effort)
6. Extract custom `useFetch` hook to eliminate data-fetching duplication
7. Decompose each admin page into sub-components (<200 lines each)
8. Wrap multi-statement DB operations in transactions
9. Add `zod` validation schemas for all API inputs
10. Add authentication (NextAuth.js)

### Phase 3: Quality (Medium Impact, Medium Effort)
11. Set up Vitest with tests for `lib/` utilities
12. Add API route integration tests
13. Create `lib/api-utils.ts` error handling wrapper
14. Add structured logging
15. Extract seed data to JSON fixture

### Phase 4: Polish (Medium Impact, Low Effort)
16. Add session end (PUT/PATCH) API endpoint
17. Add foreign-key-aware DELETE guards
18. Replace magic revenue numbers with named constants
19. Fix timezone handling for date queries
20. Add API client abstraction for frontend fetch calls

---

## Metrics Summary

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Max component lines | 632 | <300 | ❌ |
| Max `useState` per component | 18 | ≤6 | ❌ |
| Test coverage | 0% | ≥70% | ❌ |
| Duplicated functions | 3 (conditionScore) | 0 | ❌ |
| Shared type definitions | 0 files | 1 canonical file | ❌ |
| Auth-protected routes | 0/17 | 17/17 | ❌ |
| Cyclomatic complexity (dashboard API) | ~12 | <10 | ⚠️ |
| API input validation | Minimal | Comprehensive (zod) | ⚠️ |
| TypeScript strict mode | ✅ | ✅ | ✅ |
| Accessibility coverage | Strong | Strong | ✅ |
| Error/loading UX | Complete | Complete | ✅ |
| DB indexing | Appropriate | Appropriate | ✅ |
