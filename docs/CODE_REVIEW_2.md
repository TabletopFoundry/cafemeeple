# Code Quality & Architecture Review — CaféMeeple (Follow-up)

**Reviewer:** Principal Software Engineer (automated review)
**Date:** 2025-07-22
**Scope:** Delta review — only **new P0/P1 findings** not covered by `CODE_REVIEW.md`
**Codebase snapshot:** 14 API route files, 6 lib files, 6 components, 6 admin pages (~1,155 LOC in pages)

---

## Progress Since CODE_REVIEW.md

Several critical items from the original review have been **resolved**:

| Original Finding | Status |
|-----------------|--------|
| P0-3: SQL injection in `addColumnIfMissing` | ✅ Fixed — `KNOWN_TABLES` allowlist + regex validation added |
| P0-4: Database files committed | ✅ Fixed — `.gitignore` covers `*.db*`; files no longer tracked |
| P1-2: Triplicated `conditionScoreForLabel` | ✅ Fixed — centralized in `lib/game-utils.ts`, imported everywhere |
| P1-3: No shared type definitions | ✅ Fixed — canonical types in `lib/types.ts` with `Pick<>` subsets |
| P1-4: Data fetching duplicated | ✅ Fixed — `hooks/useFetch.ts` with `useFetch` and `useMultiFetch` |
| P1-5: Checkout/return lacks transactions | ✅ Fixed — `db.transaction()` wraps all multi-statement writes |
| P1-6: `needs_replacement` double-write | ✅ Fixed — single UPDATE with inline CASE expression |
| P1-7: Dashboard magic numbers | ✅ Fixed — extracted to `DASHBOARD_ESTIMATES` constant object |
| P1-8: Module-level mutable singleton | ✅ Fixed — uses `globalThis.__cafemeeple_db` pattern |
| P2-1: Seed file externalization | Unchanged (still inline) |
| P2-8: Toast ID uses module `let nextId` | Unchanged (still module-level) |

**Admin page god-components (P1-1):** Significantly improved — largest page dropped from 632 → 250 lines. All pages are now under 250 lines.

---

## New P0 — Critical

### P0-NEW-1: RSVP Creation Has a TOCTOU Race + Missing Transaction

**File:** `app/api/events/[id]/rsvps/route.ts:37–50`

The capacity check (read) and the insert+update (write) are not atomic. Two concurrent RSVP requests can both pass the capacity check and overbook an event.

```ts
// Line 37: READ — check capacity (outside any transaction)
const currentRsvps = db.prepare("SELECT SUM(party_size) as total FROM rsvps WHERE event_id = ?").get(id);
const currentTotal = currentRsvps.total || 0;

if (currentTotal + newPartySize > event.capacity) { /* reject */ }

// Line 45-50: WRITE — insert RSVP and update count (no transaction)
const result = db.prepare(`INSERT INTO rsvps ...`).run(id, guest_name, guest_email || "", newPartySize);
db.prepare("UPDATE events SET rsvp_count = ? WHERE id = ?").run(currentTotal + newPartySize, id);
```

**Two bugs here:**
1. **Race condition:** Concurrent requests both read the same `currentTotal`, both pass the check, both insert — resulting in overbooking.
2. **No transaction:** The INSERT and UPDATE are separate statements. If the process crashes between them, `rsvp_count` on the events table will be permanently out of sync with the actual RSVP rows.

**Fix:**
```ts
const rsvpTx = db.transaction(() => {
  const current = db.prepare(
    "SELECT SUM(party_size) as total FROM rsvps WHERE event_id = ?"
  ).get(id) as { total: number | null };
  const currentTotal = current.total ?? 0;

  if (currentTotal + newPartySize > event.capacity) {
    throw new Error("CAPACITY_EXCEEDED");
  }

  const result = db.prepare(
    "INSERT INTO rsvps (event_id, guest_name, guest_email, party_size) VALUES (?, ?, ?, ?)"
  ).run(id, guest_name, guest_email || "", newPartySize);

  db.prepare("UPDATE events SET rsvp_count = ? WHERE id = ?")
    .run(currentTotal + newPartySize, id);

  return result;
});
```

Since SQLite serializes write transactions, moving the check inside the transaction eliminates the race.

---

### P0-NEW-2: Checkout Availability Check is Outside Transaction (TOCTOU)

**File:** `app/api/checkout/route.ts:57–75`

```ts
// Line 57-61: READ — check availability (outside transaction)
const game = db.prepare("SELECT copies_available FROM games WHERE id = ?").get(game_id);
if (!game || game.copies_available <= 0) {
  return Response.json({ error: "Game not available" }, { status: 400 });
}

// Line 64-73: WRITE — decrement (inside transaction)
const checkoutTx = db.transaction(() => {
  db.prepare(`INSERT INTO game_checkouts ...`).run(session_id, game_id);
  db.prepare("UPDATE games SET copies_available = copies_available - 1 ...").run(game_id);
});
```

Two concurrent checkout requests for the last available copy will both pass `copies_available <= 0`, both enter the transaction sequentially, and drive `copies_available` to **-1**.

**Fix:** Move the availability check inside the transaction, or add a `CHECK(copies_available >= 0)` constraint to the `games` table so the second transaction fails at the DB level:

```sql
-- Schema fix (defense in depth):
ALTER TABLE games ADD CHECK (copies_available >= 0);
```

```ts
// Application fix:
const checkoutTx = db.transaction(() => {
  const game = db.prepare("SELECT copies_available FROM games WHERE id = ?").get(game_id);
  if (!game || game.copies_available <= 0) throw new Error("GAME_UNAVAILABLE");

  db.prepare("INSERT INTO game_checkouts (session_id, game_id) VALUES (?, ?)").run(session_id, game_id);
  db.prepare("UPDATE games SET copies_available = copies_available - 1, updated_at = datetime('now') WHERE id = ?").run(game_id);
});
```

---

### P0-NEW-3: Session Creation Race Allows Duplicate Active Sessions Per Table

**File:** `app/api/sessions/route.ts:82–118`

```ts
// Line 82-86: READ — check for existing active session (outside transaction)
const activeSession = db
  .prepare("SELECT id FROM sessions WHERE table_id = ? AND status = 'active'")
  .get(table_id);
if (activeSession) { return Response.json({ error: "Table is already occupied" }, { status: 400 }); }

// Line 107-116: WRITE — insert session + update table (inside transaction)
const sessionTx = db.transaction(() => {
  db.prepare(`INSERT INTO sessions ...`).run(table_id, ...);
  db.prepare("UPDATE tables SET status = 'occupied' WHERE id = ?").run(table_id);
});
```

Same TOCTOU pattern: two simultaneous requests both see no active session, both create one, leaving a table with two active sessions and corrupted billing state.

**Fix:** Move the active-session check inside the transaction. Additionally, add a **partial unique index** as a database-level safety net:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_table
  ON sessions(table_id) WHERE status = 'active';
```

---

## New P1 — High Priority

### P1-NEW-1: DELETE Endpoints Return 200 for Non-Existent Resources

**Files:**
- `app/api/events/[id]/route.ts:58–67` — DELETE always returns `{ success: true }`
- `app/api/reservations/[id]/route.ts:54–63` — same pattern

```ts
// events/[id]/route.ts:61-62
db.prepare("DELETE FROM rsvps WHERE event_id = ?").run(id);
db.prepare("DELETE FROM events WHERE id = ?").run(id);
return Response.json({ success: true }); // ← No check if event existed
```

Deleting a non-existent event or reservation returns 200 `{ success: true }`. This masks client bugs (e.g., stale IDs, double-delete), violates REST semantics, and makes debugging harder.

Note: The `games/[id]` DELETE **does** check `result.changes === 0` and returns 404 — this pattern should be applied consistently.

**Fix:**
```ts
const result = db.prepare("DELETE FROM events WHERE id = ?").run(id);
if (result.changes === 0) {
  return Response.json({ error: "Event not found" }, { status: 404 });
}
```

---

### P1-NEW-2: PUT Endpoints Return `null` for Non-Existent Resources

**Files:**
- `app/api/events/[id]/route.ts:44–47`
- `app/api/reservations/[id]/route.ts:41–44`

```ts
// events/[id]/route.ts:44-47
values.push(id);
db.prepare(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`).run(...values);
const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
return Response.json(event); // ← returns null if id doesn't exist, with 200 status
```

If the `id` doesn't match any row, the UPDATE silently changes 0 rows and the subsequent SELECT returns `undefined`, which `Response.json()` serializes as `null` with a 200 status code.

**Fix:** Check `result.changes` after UPDATE, or verify existence before updating:
```ts
const result = db.prepare(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`).run(...values);
if (result.changes === 0) {
  return Response.json({ error: "Event not found" }, { status: 404 });
}
```

---

### P1-NEW-3: `validateNonNegativeNumber` Has Contradictory Type Check

**File:** `lib/validation.ts:15–21`

```ts
export function validateNonNegativeNumber(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  if (typeof value !== "number" || isNaN(n) || n < 0) {
    //  ^^^^^^^^^^^^^^^^^^^^^^^^
    //  This rejects strings like "5.00" even though Number("5.00") === 5
    return `${field} must be a non-negative number`;
  }
  return null;
}
```

The `typeof value !== "number"` check conflicts with `Number(value)` conversion on the line above. Since request bodies are parsed from JSON, numeric fields **are** native numbers — but this creates a fragile assumption. Compare with `validatePositiveInt` (line 6-12) which does **not** check `typeof` and works correctly with any coercible input.

The inconsistency means `validateNonNegativeNumber` and `validatePositiveInt` have different strictness policies for no documented reason. If a client sends `cover_charge_per_person: "5.00"` (a string), `validatePositiveInt` would accept it but `validateNonNegativeNumber` would reject it.

**Fix:** Remove the `typeof` check to match `validatePositiveInt` behavior:
```ts
if (isNaN(n) || n < 0) {
  return `${field} must be a non-negative number`;
}
```

---

### P1-NEW-4: Session Checkout Silently Auto-Returns Games Without Updating Condition

**File:** `app/api/sessions/[id]/route.ts:50–58`

When a session is "checked out" (ended), all unreturned games are force-returned:

```ts
const closeTx = db.transaction(() => {
  db.prepare(`UPDATE sessions SET status = 'completed', ended_at = datetime('now'), total_charge = ? WHERE id = ?`)
    .run(total, id);
  db.prepare("UPDATE tables SET status = 'available' WHERE id = ?")
    .run(session.table_id);
  // Line 56-57: Force-return all unreturned games
  db.prepare(
    `UPDATE game_checkouts SET returned_at = datetime('now'), return_condition = COALESCE(return_condition, 'Good') WHERE session_id = ? AND returned_at IS NULL`
  ).run(id);
});
```

**Three issues:**
1. **`copies_available` is never incremented** — the games table still thinks copies are checked out. Inventory count becomes permanently wrong.
2. **`condition`/`condition_score`/`needs_replacement` on the games table are never updated** — unlike the explicit return endpoint which updates all three fields.
3. **No user feedback** — the response includes `activeGames: activeGames.count` (computed *before* the close transaction), but the UI doesn't warn that games were auto-returned.

**Fix:** Add the matching `UPDATE games` for each auto-returned checkout:
```ts
const closeTx = db.transaction(() => {
  // ... existing session + table updates ...

  // Get games to return before updating checkouts
  const unreturned = db.prepare(
    "SELECT game_id FROM game_checkouts WHERE session_id = ? AND returned_at IS NULL"
  ).all(id) as { game_id: number }[];

  db.prepare(
    `UPDATE game_checkouts SET returned_at = datetime('now'), return_condition = COALESCE(return_condition, 'Good')
     WHERE session_id = ? AND returned_at IS NULL`
  ).run(id);

  // Restore inventory for each auto-returned game
  for (const { game_id } of unreturned) {
    db.prepare(
      "UPDATE games SET copies_available = copies_available + 1, updated_at = datetime('now') WHERE id = ?"
    ).run(game_id);
  }
});
```

---

### P1-NEW-5: `VALID_EVENT_TYPES` and `VALID_EVENT_STATUSES` Defined Twice

**Files:**
- `app/api/events/route.ts:4–5`
- `app/api/events/[id]/route.ts:4–5`

```ts
// Both files independently define:
const VALID_EVENT_TYPES = ["Game Night", "Tournament", "Workshop", "Social", "Family Event", "Special"] as const;
const VALID_EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;
```

These are identical copies that must stay in sync. Adding a new event type requires editing both files.

**Fix:** Move to a shared constants file (e.g., `lib/constants.ts`) alongside the already-centralized `CONDITION_LABELS`.

---

### P1-NEW-6: Dashboard Interpolates Constants Into SQL Via Template Literals

**File:** `app/api/dashboard/route.ts:57–68`

```ts
SELECT 'Food & Beverage' as category,
  ROUND(COALESCE(SUM(party_size * ${DASHBOARD_ESTIMATES.avgFoodBeveragePerPerson}), 0), 2) as value
```

While the interpolated values are from a `const` object (not user input), embedding JS values into SQL strings via template literals is the same anti-pattern as string interpolation for user input. It bypasses parameterization, defeats prepared-statement caching, and sets a precedent for unsafe patterns elsewhere.

**Fix:** Use parameterized queries:
```ts
db.prepare(`
  SELECT 'Food & Beverage' as category,
    ROUND(COALESCE(SUM(party_size * ?), 0), 2) as value
  FROM sessions WHERE started_at >= date('now', '-30 days')
`).get(DASHBOARD_ESTIMATES.avgFoodBeveragePerPerson);
```

Note: Since this is a UNION ALL query, it may require restructuring as separate queries or using a CTE with a parameter table.

---

## Summary

| ID | Severity | Category | Issue |
|----|----------|----------|-------|
| P0-NEW-1 | 🔴 Critical | Data integrity | RSVP overbooking race condition + missing transaction |
| P0-NEW-2 | 🔴 Critical | Data integrity | Checkout drives `copies_available` negative under concurrency |
| P0-NEW-3 | 🔴 Critical | Data integrity | Duplicate active sessions per table under concurrency |
| P1-NEW-1 | 🟠 High | API correctness | DELETE returns 200 for non-existent events/reservations |
| P1-NEW-2 | 🟠 High | API correctness | PUT returns `null`/200 for non-existent events/reservations |
| P1-NEW-3 | 🟠 High | Validation | `validateNonNegativeNumber` inconsistent with other validators |
| P1-NEW-4 | 🟠 High | Data integrity | Session close auto-return doesn't restore `copies_available` |
| P1-NEW-5 | 🟡 Medium | DRY | Event type/status constants duplicated across 2 files |
| P1-NEW-6 | 🟡 Medium | Security hygiene | Dashboard SQL uses template literal interpolation for constants |

---

## Refactoring Priority (New Items Only)

### Immediate (< 1 day)
1. **P1-NEW-4** — Session close inventory bug. This is actively causing data corruption in normal usage (not just under concurrency). Highest practical impact.
2. **P0-NEW-1/2/3** — Wrap all read-then-write sequences inside `db.transaction()`. Since SQLite serializes write transactions, moving checks inside transactions eliminates races. ~30 min per endpoint.
3. **P1-NEW-1/2** — Add `result.changes === 0` checks to event and reservation DELETE/PUT handlers. Copy the pattern from `games/[id]` DELETE. ~10 min.

### Short-term (< 1 sprint)
4. **P1-NEW-3** — Fix `validateNonNegativeNumber` type check inconsistency. ~5 min.
5. **P1-NEW-5** — Extract event constants to shared module. ~10 min.
6. **P1-NEW-6** — Refactor dashboard query to use parameterized values. ~30 min.
7. Add `CHECK(copies_available >= 0)` and partial unique index on sessions as database-level guards.

---

## Positive Observations (New Since CODE_REVIEW.md)

1. **Significant refactoring completed** — The team addressed 10 of 17 original findings. Admin pages shrank from 500–632 lines to 141–250 lines. This is excellent execution.
2. **Transaction usage adopted** — Checkout, return, and session-close flows now use `db.transaction()` correctly (the remaining issue is that the *checks* are still outside).
3. **Validation layer added** — `lib/validation.ts` provides reusable validators that are consistently applied across POST/PUT handlers.
4. **Type system improved** — `lib/types.ts` provides canonical types with `Pick<>` subsets, and API routes reference them via imports.
5. **Custom hooks extracted** — `useFetch`/`useMultiFetch` cleanly handle loading, error, cancellation, and refresh with proper cleanup.
