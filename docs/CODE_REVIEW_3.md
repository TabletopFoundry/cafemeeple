# Code Quality & Architecture Review — CaféMeeple (Review #3)

**Reviewer:** Principal Software Engineer (automated review)
**Date:** 2025-07-23
**Scope:** Delta review — only **new P0/P1 findings** not covered by `CODE_REVIEW.md` or `CODE_REVIEW_2.md`
**Codebase snapshot:** 14 API route files, 7 lib files, 6 shared components, 6 admin pages + 16 sub-components (~7,005 LOC total)

---

## Progress Since CODE_REVIEW_2.md

| CODE_REVIEW_2 Finding | Status |
|----------------------|--------|
| P0-NEW-1: RSVP TOCTOU race + missing transaction | ✅ Fixed — capacity check + insert wrapped in `db.transaction()` (`events/[id]/rsvps/route.ts:39–58`) |
| P0-NEW-2: Checkout availability outside transaction | ✅ Fixed — availability check moved inside `checkoutTx` (`checkout/route.ts:57–73`) |
| P0-NEW-3: Session creation race (duplicate active sessions) | ✅ Fixed — active-session check moved inside `sessionTx` (`sessions/route.ts:86–121`) |
| P1-NEW-1: DELETE returns 200 for non-existent resources | ✅ Fixed — both `events/[id]` and `reservations/[id]` now check `result.changes === 0` and return 404 |
| P1-NEW-2: PUT returns null for non-existent resources | ✅ Fixed — both endpoints now check `result.changes === 0` |
| P1-NEW-3: `validateNonNegativeNumber` contradictory type check | ✅ Fixed — `typeof` check removed, now consistent with `validatePositiveInt` (`validation.ts:33`) |
| P1-NEW-4: Session close auto-return doesn't restore inventory | ✅ Fixed — `closeTx` now queries unreturned games and increments `copies_available` (`sessions/[id]/route.ts:56–70`) |
| P1-NEW-5: Event type/status constants duplicated | ✅ Fixed — centralized in `lib/constants.ts`, imported by both routes |
| P1-NEW-6: Dashboard SQL template literal interpolation | ✅ Fixed — all four revenue queries now use parameterized `?` placeholders (`dashboard/route.ts:58–81`) |

**All 9 findings from CODE_REVIEW_2 have been addressed.** The team's velocity on fixes remains excellent.

---

## Outstanding Items from Prior Reviews (Still Open)

These are tracked for completeness — they are NOT new findings:

| ID | From | Issue | Notes |
|----|------|-------|-------|
| P0-1 | CR1 | Zero test coverage | Still 0 test files |
| P0-2 | CR1 | No authentication | Still fully open admin |
| P2-1 | CR1 | Seed file inline (430 LOC) | Unchanged |
| P2-3 | CR1 | Error messages may leak internals | `catch → error.message` still exposes raw errors |
| P2-6 | CR1 | No runtime API response validation | Still using `as T` casts |
| P2-7 | CR1 | Extreme Tailwind line lengths | Unchanged |
| P2-8 | CR1 | Toast `nextId` module-level counter | Unchanged |
| P2-11 | CR1 | Server vs local timezone mismatch | Unchanged |

---

## New P0 — Critical

_None identified._ All critical data-integrity patterns (TOCTOU races, missing transactions) from prior reviews have been resolved.

---

## New P1 — High Priority

### P1-3-1: Games Page Bypasses `useFetch` — Re-Implements Fetch With Debounce Inline

**File:** `app/admin/games/page.tsx:18–64`

The games page is the **only** admin page that does NOT use the shared `useFetch` or `useMultiFetch` hook. It manually re-implements the entire fetch lifecycle with `useState` + `useEffect` + `setTimeout` debounce:

```ts
// games/page.tsx:18-31 — manual state that useFetch already provides
const [games, setGames] = useState<Game[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [refreshKey, setRefreshKey] = useState(0);

// games/page.tsx:34-64 — 30 lines of custom fetch+debounce logic
useEffect(() => {
  let cancelled = false;
  const timer = setTimeout(async () => {
    // ... fetch, setLoading, setError, cancelled check ...
  }, 250);
  return () => { cancelled = true; clearTimeout(timer); };
}, [search, categoryFilter, ...]);
```

Every other page (`tables`, `reservations`, `events`, `checkout`, `dashboard`) uses `useFetch`/`useMultiFetch`. This creates three problems:

1. **DRY violation** — The cancellation pattern, loading/error state, and refresh mechanism are identical to what `useFetch` already provides.
2. **Inconsistency risk** — If a bug is fixed in `useFetch` (e.g., AbortController support, error normalization), this page won't benefit.
3. **The debounce justification is valid** — but the fix is to add a `debounce` option to `useFetch`, not to duplicate the hook.

**Fix:** Extend `useFetch` with an optional `debounceMs` parameter:

```ts
// hooks/useFetch.ts
export function useFetch<T>(url: string, deps?: unknown[], options?: { debounceMs?: number }): UseFetchResult<T> {
  // ... existing logic, but wrap load() in setTimeout when debounceMs > 0
}
```

Then in `games/page.tsx`:

```ts
const queryString = buildGameQuery(search, categoryFilter, ...);
const { data: games, loading, error, refresh } = useFetch<Game[]>(
  `/api/games?${queryString}`,
  [search, categoryFilter, conditionFilter, complexityFilter, playerCountFilter, replacementOnly],
  { debounceMs: 250 },
);
```

---

### P1-3-2: Session Close Returns Stale `activeGames` Count

**File:** `app/api/sessions/[id]/route.ts:41–43, 74–80`

```ts
// Line 41-43: COUNT computed BEFORE the close transaction
const activeGames = db
  .prepare("SELECT COUNT(*) as count FROM game_checkouts WHERE session_id = ? AND returned_at IS NULL")
  .get(id) as { count: number };

// ... closeTx() runs, auto-returns all games ...

// Line 74-80: Response uses the PRE-close count
return Response.json({
  activeGames: activeGames.count,  // ← Always > 0 if games were auto-returned
  // ...
});
```

The `activeGames` count is read **before** the transaction that auto-returns unreturned games. The response always reports the stale pre-close count, which will confuse clients (e.g., checkout receipt showing "2 games still out" when they were just auto-returned).

**Fix:** Move the count inside the transaction, or compute it after:

```ts
const closeTx = db.transaction(() => {
  const unreturned = db.prepare(
    "SELECT game_id FROM game_checkouts WHERE session_id = ? AND returned_at IS NULL"
  ).all(id) as { game_id: number }[];

  // ... close session, auto-return games ...

  return { autoReturnedCount: unreturned.length };
});

const { autoReturnedCount } = closeTx();

return Response.json({
  // ...
  autoReturnedGames: autoReturnedCount,
  activeGames: 0, // all games returned at close
});
```

---

### P1-3-3: Session Close Doesn't Update `condition` / `condition_score` for Auto-Returned Games

**File:** `app/api/sessions/[id]/route.ts:61–63`

```ts
// Line 61-63: Auto-return only sets returned_at and return_condition
db.prepare(
  `UPDATE game_checkouts SET returned_at = datetime('now'),
     return_condition = COALESCE(return_condition, 'Good')
   WHERE session_id = ? AND returned_at IS NULL`
).run(id);
```

Compared to the explicit return endpoint (`checkout/[id]/return/route.ts:40–57`), the auto-return path:

| Field | Explicit Return | Auto-Return (session close) |
|-------|----------------|---------------------------|
| `game_checkouts.returned_at` | ✅ Set | ✅ Set |
| `game_checkouts.return_condition` | ✅ Set | ✅ Set (defaults to "Good") |
| `games.copies_available` | ✅ Incremented | ✅ Incremented (fixed in CR2) |
| `games.condition` | ✅ Updated | ❌ **Not updated** |
| `games.condition_score` | ✅ Updated | ❌ **Not updated** |
| `games.last_inspected_at` | ✅ Updated | ❌ **Not updated** |
| `games.needs_replacement` | ✅ Recomputed | ❌ **Not updated** |

While the inventory count was fixed, the game **condition metadata** is still not updated for auto-returns. This means:
- A game auto-returned as "Good" still shows its previous (possibly worse) condition in the library.
- The `needs_replacement` flag is never recalculated for auto-returned games.

**Impact:** Low-medium in practice (defaulting to "Good" means no degradation is assumed), but the inconsistency between the two return paths is a maintenance trap — future developers will expect them to behave identically.

**Fix:** Apply the same game condition update for each auto-returned game:

```ts
for (const { game_id } of unreturned) {
  const conditionScore = conditionScoreForLabel("Good"); // 4
  db.prepare(`
    UPDATE games SET
      copies_available = copies_available + 1,
      condition = 'Good',
      condition_score = ?,
      last_inspected_at = datetime('now'),
      needs_replacement = CASE
        WHEN ? <= 2 THEN 1
        WHEN (SELECT COUNT(*) FROM game_checkouts WHERE game_id = ?) >= replacement_threshold THEN 1
        ELSE 0
      END,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(conditionScore, conditionScore, game_id, game_id);
}
```

Or better yet, extract a shared `returnGame(db, gameId, condition)` function used by both paths.

---

### P1-3-4: Reservation Creation Accepts Any `table_id` Without Verifying Table Exists or Has Capacity

**File:** `app/api/reservations/route.ts:56–69`

```ts
const result = db.prepare(`
  INSERT INTO reservations (guest_name, ..., table_id, ...)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  guest_name,
  // ...
  table_id || null,  // ← No validation that this table exists
  // ...
);
```

Unlike session creation (which validates table existence, capacity, and reservation conflicts), reservation creation:

1. **Never checks if `table_id` references a real table** — a client can pass `table_id: 99999` and the INSERT succeeds (no FK enforcement error because `FOREIGN KEY (table_id) REFERENCES tables(id)` will only fail if `PRAGMA foreign_keys = ON` AND the value is not NULL, but only after the value is already in the INSERT — and the FK is only set for non-NULL values).
2. **Never checks party_size vs table capacity** — a reservation for 12 people can be assigned to a 2-seat table.
3. **Never checks for overlapping reservations** — two reservations can be made for the same table at the same time.

The session creation endpoint (`sessions/route.ts:66–83`) validates all three of these. The reservation endpoint should too.

**Fix:**
```ts
if (table_id) {
  const table = db.prepare("SELECT id, capacity FROM tables WHERE id = ?").get(table_id);
  if (!table) {
    return Response.json({ error: "Table not found" }, { status: 404 });
  }
  if (party_size && party_size > table.capacity) {
    return Response.json(
      { error: `Party size exceeds table capacity (${table.capacity})` },
      { status: 400 },
    );
  }
}
```

---

### P1-3-5: `useMultiFetch` Reconstructs URL Map From Serialized String — Fragile Parsing

**File:** `hooks/useFetch.ts:117–131`

```ts
// Line 117: Serialize the URL map to a dependency key
const urlKey = Object.entries(urls).map(([k, v]) => `${k}:${v}`).join("|");

// Line 127-129: Deserialize inside the effect
const entries = urlKey.split("|").map((pair) => {
  const sep = pair.indexOf(":");
  return [pair.slice(0, sep), pair.slice(sep + 1)] as [keyof T, string];
});
```

This serialize→deserialize pattern is fragile:
1. **URL keys containing `|` will break** — a URL like `/api/data?a=1|2` will split incorrectly.
2. **Keys containing `:` will break** — a key like `http:resource` will split at the wrong position.
3. **Unnecessary complexity** — the serialization exists only to create a stable dependency for `useEffect`. A simpler approach uses `JSON.stringify` or `useMemo`.

While current URLs don't contain these characters, this is a latent bug that will surface when URLs with query parameters containing special characters are used.

**Fix:** Use `JSON.stringify` for the dependency key and the original `urls` object inside the effect:

```ts
const urlsRef = useRef(urls);
urlsRef.current = urls;
const urlKey = JSON.stringify(urls);

useEffect(() => {
  const currentUrls = urlsRef.current;
  // use currentUrls directly — no parsing needed
  const entries = Object.entries(currentUrls) as [keyof T, string][];
  // ...
}, [urlKey, refreshKey, ...deps]);
```

---

### P1-3-6: `addColumnIfMissing` Definition Regex Allows SQL Injection Via Crafted Column Definitions

**File:** `lib/db.ts:197–202`

```ts
if (!/^[A-Z (),.'0-9_]+$/i.test(definition)) {
  throw new Error(`Invalid column definition: ${definition}`);
}
// ...
database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
```

The definition regex allows single quotes (`'`), parentheses, and spaces — enough to craft a valid SQL injection payload. For example, a definition like `TEXT DEFAULT '' ; DROP TABLE games --` would pass the regex (all characters are in `[A-Z (),.'0-9_]`) and execute arbitrary SQL via `database.exec()`.

Currently all callers pass safe hardcoded strings (e.g., `"INTEGER NOT NULL DEFAULT 4"`), so this is not exploitable today. But the validation is intended as a safety net, and it has a hole.

**Fix:** Tighten the regex to disallow semicolons (already done) but also disallow sequences that could form SQL statements. Better yet, use an allowlist of known definitions:

```ts
const KNOWN_DEFINITIONS: Record<string, string> = {
  "condition_score": "INTEGER NOT NULL DEFAULT 4",
  "last_inspected_at": "TEXT",
  "replacement_threshold": "INTEGER NOT NULL DEFAULT 12",
  "rate_type": "TEXT NOT NULL DEFAULT 'per_person'",
};

function addColumnIfMissing(database: Database.Database, tableName: string, columnName: string) {
  if (!KNOWN_TABLES.has(tableName)) throw new Error(`Unknown table: ${tableName}`);
  const definition = KNOWN_DEFINITIONS[columnName];
  if (!definition) throw new Error(`Unknown column: ${columnName}`);
  // ...
}
```

---

## Summary

| ID | Severity | Category | Issue |
|----|----------|----------|-------|
| P1-3-1 | 🟠 High | DRY / Consistency | Games page bypasses `useFetch`, re-implements fetch+debounce inline |
| P1-3-2 | 🟠 High | API correctness | Session close response reports stale `activeGames` count |
| P1-3-3 | 🟡 Medium | Data consistency | Auto-return path skips game condition/score/replacement update |
| P1-3-4 | 🟠 High | Validation | Reservation creation accepts invalid `table_id`, ignores capacity/conflicts |
| P1-3-5 | 🟡 Medium | Robustness | `useMultiFetch` URL parsing breaks on `|` or `:` in URLs |
| P1-3-6 | 🟡 Medium | Security hygiene | `addColumnIfMissing` definition regex is too permissive |

---

## Refactoring Priority (New Items Only)

### Immediate (< 1 day)

1. **P1-3-2** — Move `activeGames` count inside or after the close transaction. 5 min, prevents confusing checkout receipts.
2. **P1-3-4** — Add table existence and capacity validation to reservation POST. ~15 min. Copy the pattern already used in `sessions/route.ts`.
3. **P1-3-5** — Replace `urlKey` serialization with `JSON.stringify`. ~10 min, eliminates a latent parsing bug.

### Short-term (< 1 sprint)

4. **P1-3-1** — Add `debounceMs` option to `useFetch` and migrate games page. ~30 min. Eliminates the last manual fetch pattern.
5. **P1-3-3** — Extract a shared `returnGame()` function from the explicit return endpoint and call it from both paths. ~30 min.
6. **P1-3-6** — Replace definition regex with a known-definitions allowlist. ~10 min, removes the last SQL injection surface in schema migration code.

---

## Positive Observations (New Since CODE_REVIEW_2.md)

1. **100% resolution rate** — All 9 findings from CODE_REVIEW_2 were addressed. The TOCTOU race fixes in particular demonstrate strong understanding of SQLite transaction semantics.
2. **Constants fully centralized** — `lib/constants.ts` is comprehensive with clear section headers and JSDoc. Event types, statuses, table shapes, sections, game categories, rate types, and defaults are all in one place.
3. **Validation layer is consistent** — All POST/PUT endpoints now use `firstError()` + `validatePositiveInt()` / `validateEnum()` / `validateRange()`. The validators are well-documented with JSDoc.
4. **Transaction patterns are correct** — Session creation checks active sessions + reservation conflicts inside the transaction. Checkout checks availability inside the transaction. RSVP checks capacity inside the transaction. All three use the throw-in-transaction + catch-outside pattern consistently.
5. **Admin pages are well-decomposed** — Largest page is 253 lines (reservations). All 5 feature pages extract sub-components into `components/` directories. The checkout page's `CheckoutForm` / `CheckoutTable` / `CheckoutHistory` / `ReturnModal` split is particularly clean.
6. **Shared hooks and components are solid** — `useFetch`/`useMultiFetch` with proper cancellation, `Modal` with focus trap and scroll lock, `ConfirmDialog`, `ErrorBoundary`, `ToastProvider` with proper timeout cleanup. These are production-quality patterns.
7. **Type system is well-structured** — `lib/types.ts` with JSDoc, `Pick<>`/`Omit<>` for view-specific projections (e.g., `GameSummary`, `GameRow`, `CheckoutSession`), and union types for all status fields.
