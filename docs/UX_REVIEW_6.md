# CaféMeeple — Sixth-Pass UX & Developer Experience Audit

> **Auditor perspective**: Senior full-stack engineer performing a focused sixth review after five improvement rounds.
> **Date**: 2025-07-23
> **Scope**: Only genuinely new P0/P1 issues not documented in Reviews 1–5 or CODE_REVIEW / CODE_REVIEW_2. No re-flagging of known items.
> **Baseline**: Reviews 1–5 (`docs/UX_REVIEW.md` through `docs/UX_REVIEW_5.md`) plus `docs/CODE_REVIEW.md` and `docs/CODE_REVIEW_2.md`. All prior P0s resolved: session close transactional + idempotent, PUT routes validated, RSVP/checkout/session races wrapped in transactions, enum mismatches fixed (RateType, SessionStatus), `| string` escape hatches removed, game DELETE checks FK history, button order consistent, `formatElapsed` extracted, dashboard uses `useFetch`, `ErrorMessage` has `role="alert"`, `EmptyState` emoji `aria-hidden`.

---

## 1. Executive Summary

CaféMeeple has been polished across five UX and two code reviews, resolving all prior P0s. The data integrity, accessibility, and consistency foundations are solid. This sixth pass reveals a cluster of **input validation blind spots** in the Tables API (no validation at all on POST) and the Reservation/Session conflict logic (time-slot overlap not modeled). A secondary cluster covers **client-side resilience gaps**: the CheckInModal crashes when opened with zero available tables, the game delete flow swallows the server's FK constraint error, and the Reservation "Save" handler surfaces errors as unhandled promise rejections in the parent. One new DX finding covers a `useMultiFetch` stale-closure risk. All 7 findings are genuinely new and none overlap with anything flagged in prior reviews.

---

## 2. Previous Review Items — Quick Spot-Check

| Item | Status |
|---|---|
| RateType aligned to `per_table` (R5 P0-1) | ✅ Fixed — `lib/types.ts:25`, `lib/constants.ts:38` both say `"per_table"` |
| SessionStatus aligned to `completed` (R5 P0-2) | ✅ Fixed — `lib/types.ts:22`, `lib/constants.ts:32` both say `"completed"` |
| Game DELETE FK check (R5 P0-3) | ✅ Fixed — `games/[id]/route.ts:142-151` returns 409 |
| Reservation status validated (R5 P1-1) | ✅ Fixed — `reservations/route.ts:50`, `reservations/[id]/route.ts:25` use `validateEnum` |
| `| string` removed from types (R5 P1-2) | ✅ Fixed — all fields are tight unions now |
| GAME_CATEGORIES imported (R5 P1-3) | ✅ Fixed — `games/page.tsx:14` imports from `lib/constants.ts` |
| EVENT_TYPES imported (R5 P1-4) | ✅ Fixed — `events/page.tsx:14` imports `VALID_EVENT_TYPES` |
| EventModal uses VALID_EVENT_STATUSES (R5 P1-5) | ✅ Fixed — `EventModal.tsx:158` maps over constant |
| RSVP race wrapped in transaction (CR2 P0-1) | ✅ Fixed — `rsvps/route.ts:39-58` uses `db.transaction()` |
| Checkout TOCTOU wrapped (CR2 P0-2) | ✅ Fixed — `checkout/route.ts:57-73` check inside transaction |
| Session creation race wrapped (CR2 P0-3) | ✅ Fixed — `sessions/route.ts:82-115` check inside transaction |
| DELETE returns 404 for missing (CR2 P1-1) | ✅ Fixed — `events/[id]/route.ts:63-65`, `reservations/[id]/route.ts:63-65` |
| PUT returns 404 for missing (CR2 P1-2) | ✅ Fixed — `events/[id]/route.ts:42-44`, `reservations/[id]/route.ts:43-45` |
| `validateNonNegativeNumber` type check (CR2 P1-3) | ✅ Fixed — `validation.ts:33` uses `isNaN(n)` only |
| Session close restores copies_available (CR2 P1-4) | ✅ Fixed — `sessions/[id]/route.ts:57-70` loop |
| Event constants deduplicated (CR2 P1-5) | ✅ Fixed — both routes import from `lib/constants.ts` |
| Dashboard SQL parameterized (CR2 P1-6) | ✅ Fixed — `dashboard/route.ts:60-64` uses `?` params |
| `useFetch` deps spread (R4 P1-6 / R5 spot-check) | ❌ Still present — `useFetch.ts:71`, `useFetch.ts:157` (P1, unchanged) |
| Toast ref cleanup warning (R3 P2-15) | ❌ Still present — `Toast.tsx:35` (P2, unchanged) |
| Admin layout `role="main"` (R2 P2-17) | ❌ Still present — `layout.tsx:50` (P2, unchanged) |

---

## 3. New Findings — P0

### P0-1: Tables POST route has zero input validation — arbitrary data enters DB

**File**: `app/api/tables/route.ts:32-57`

**Issue**: The `POST /api/tables` handler validates only two things: `name` is truthy (line 38-40) and `capacity` via `validatePositiveInt` (line 42-44). But five other fields are accepted from the request body with **no validation whatsoever** and inserted directly into the database:

- **`x_position`** / **`y_position`**: Accept any value including `NaN`, `Infinity`, negative numbers, or strings. These are used as CSS positioning coordinates in FloorMap rendering. Invalid values like `NaN` break the floor map layout (SVG/CSS `NaN` coordinates produce invisible elements).
- **`shape`**: Accepts any arbitrary string. Only `"rectangle"` and `"circle"` are handled by the UI (see `Table.shape` comment in `types.ts:101`). Sending `"pentagon"` would store successfully but render unpredictably.
- **`section`**: Accepts any string. Only `TABLE_SECTIONS` values from `lib/constants.ts:73-79` are meaningful (Main Floor, Quiet Corner, Patio, Private Room, Balcony). Invalid sections break the sidebar section grouping in FloorMap.
- **`name`**: Only checked for truthiness, not uniqueness at the application level. The DB has `UNIQUE` on `name` (`lib/db.ts:67`), so duplicates throw a raw SQLite constraint error that surfaces as `{ error: "UNIQUE constraint failed: tables.name" }` — not user-actionable.

**Concrete exploit**: `POST /api/tables` with `{ name: "Test", capacity: 4, x_position: NaN, y_position: -500, shape: "dodecahedron", section: "🔥" }` succeeds with 201 and inserts garbage into the tables table.

**Fix**:
```typescript
import { VALID_TABLE_SHAPES, TABLE_SECTIONS } from "@/lib/constants";

const validationError = firstError(
  validateRequired(name, "name"),
  validatePositiveInt(capacity, "capacity"),
  validateRange(x_position, "x_position", 0, 100),
  validateRange(y_position, "y_position", 0, 100),
  validateEnum(shape, "shape", VALID_TABLE_SHAPES),
  validateEnum(section, "section", TABLE_SECTIONS),
);
```

Also add a `VALID_TABLE_SHAPES = ["rectangle", "circle"] as const` to `lib/constants.ts` and handle the `UNIQUE` constraint violation with a user-friendly error message.

---

## 4. New Findings — P1

### P1-1: CheckInModal crashes when `tables` array is empty — `tables[0]?.id` fallback to `0` is invalid

**File**: `app/admin/tables/components/CheckInModal.tsx:16`

**Issue**: The default `table_id` is set to `tables[0]?.id ?? 0`. When opened with an empty `tables` array (which the parent passes as `availableTables` — could be empty if all tables are occupied), `table_id` initializes to `0`. The `<select>` renders zero `<option>` elements, and the form submits with `table_id: 0` to the API, which responds:

1. If no table has `id = 0` → `"Table not found"` (404) — misleading error for the user.
2. The user sees an empty dropdown with no explanation of why.

The parent (`tables/page.tsx:96-97`) disables the "Check in party" button when `availableTables.length === 0`, but the modal can still be opened via the FloorMap's `onStartCheckIn` callback (`FloorMap.tsx:36`) which doesn't have the same guard — clicking an "available" table triggers `onStartCheckIn()` without checking if the full `availableTables` list has been filtered.

**Fix**: Add an early-exit guard in CheckInModal:
```tsx
if (tables.length === 0) {
  return (
    <Modal title="Seat a new party" onClose={onClose}>
      <div className="p-6 text-center text-gray-500">
        <p>No tables are currently available.</p>
        <button onClick={onClose} className="mt-4 ...">Close</button>
      </div>
    </Modal>
  );
}
```

### P1-2: Reservation conflict check only uses `date`, ignoring time-slot overlap — blocks tables all day

**Files**:
- `app/api/sessions/route.ts:90-105` — session creation reservation check
- `app/api/tables/route.ts:7-23` — table status computation

**Issue**: Both the session creation and the table status query check for reservations on today's date:
```sql
-- sessions/route.ts:93-98
WHERE table_id = ?
  AND reservation_date = date('now')
  AND status IN ('confirmed', 'pending')

-- tables/route.ts:12-17 (status computation)
WHERE r.table_id = t.id
  AND r.reservation_date = date('now')
  AND r.status IN ('confirmed', 'pending')
```

Neither query considers `reservation_time` or `duration_minutes`. Consequences:

1. **False blocking**: A table reserved for 8:00 PM–10:00 PM shows as `"reserved"` all day (from midnight), and a walk-in at 11:00 AM cannot be seated at that table. For a café with 15 tables, this dramatically reduces effective capacity.
2. **No overlap detection**: Two reservations at the same table for the same date but overlapping times (e.g., 6:00 PM–8:00 PM and 7:00 PM–9:00 PM) are both accepted without conflict detection.
3. **Stale reservations**: Past-time reservations for today (e.g., it's 3 PM and the reservation was for 10 AM) continue to block the table until midnight.

The reservation schema has all necessary fields (`reservation_time`, `duration_minutes`) but they're unused in conflict logic.

**Fix**: Add time-window checking:
```sql
WHERE r.table_id = ?
  AND r.reservation_date = date('now')
  AND r.status IN ('confirmed', 'pending')
  AND time('now') < time(r.reservation_time, '+' || r.duration_minutes || ' minutes')
  AND time('now', '+30 minutes') > time(r.reservation_time)
```

### P1-3: Game DELETE error message swallowed — user sees generic "Failed to delete game" instead of server's 409 reason

**File**: `app/admin/games/page.tsx:77-88`

**Issue**: The `handleDelete` function catches errors but doesn't read the response body for the error message:

```typescript
const handleDelete = async (id: number) => {
  try {
    const response = await fetch(`/api/games/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete game"); // ← Generic message
    // ...
  } catch (err) {
    addToast(err instanceof Error ? err.message : "Failed to delete game", "error");
  }
};
```

When the API returns a 409 with `{ error: "Cannot delete a game with checkout history. Consider marking it as 'Needs Replacement' instead." }` (from `games/[id]/route.ts:147-149`), the user sees the unhelpful "Failed to delete game" toast instead of the actionable 409 message.

This was introduced alongside the R5 P0-3 fix (adding the FK check), but the client-side consumption was never updated to surface the new error message. The R5 fix on the API side is negated on the UX side.

Compare with the checkout page (`checkout/page.tsx:54-55`) which correctly reads the error body:
```typescript
const data = (await res.json().catch(() => null)) as { error?: string } | null;
throw new Error(data?.error || "Failed to checkout");
```

**Fix**: Read the response body before throwing:
```typescript
if (!response.ok) {
  const data = await response.json().catch(() => null);
  throw new Error(data?.error || "Failed to delete game");
}
```

### P1-4: Reservation `handleSaveReservation` throws unhandled promise rejection on API failure

**File**: `app/admin/reservations/page.tsx:96-112`

**Issue**: `handleSaveReservation` is passed to `ReservationModal` as `onSubmit`. Inside the modal (`ReservationModal.tsx:82`), it's called within a `try/catch`. But the parent function itself throws on line 108:

```typescript
// reservations/page.tsx:103-108
const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
if (!res.ok) throw new Error("Failed to save");
```

This `throw` propagates to the modal's `catch` block (`ReservationModal.tsx:83`), which shows a toast — but the error message is always the generic `"Failed to save reservation"` from the modal's catch, not the API's error response. The actual API error (e.g., `"party_size must be a positive integer"`, `"status must be one of: confirmed, pending, ..."`) is never surfaced to the user.

Additionally, the `handleSaveReservation` function resets UI state (closes modal, calls refresh) **before** checking the response on line 108. If the re-ordering were reversed (check response, then close modal), the flow would be correct — but currently lines 109-111 are dead code when `!res.ok`.

**Fix**: Read and surface the API error message:
```typescript
const handleSaveReservation = async (form, reservationId) => {
  const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Failed to save");
  }
  setShowAddModal(false);
  setEditingReservation(null);
  refresh();
};
```

### P1-5: `useMultiFetch` captures stale `urls` object in effect closure

**File**: `hooks/useFetch.ts:117-128`

**Issue**: `useMultiFetch` computes `urlKey` from `urls` (line 118) and uses `urlKey` in the dependency array (line 157). But the `load()` function on line 123 captures `urls` from the closure, not from the dependency array. If the consumer creates a new `urls` object on each render (which is exactly what happens — all call sites pass inline object literals like `{ tables: "/api/tables", sessions: "/api/sessions" }`), the `urlKey` is stable (same string), but the `urls` reference changes.

The current code works because `Object.entries(urls)` inside `load()` produces the same result when keys and values haven't changed. **However**, there's a subtle bug: if the parent component's render produces a `urls` object with the **same urlKey but different ordering** (e.g., React's render path changes the property insertion order), `Object.entries()` may iterate in a different order, causing the response data to be mapped to the wrong keys in the result object (line 136: `Object.fromEntries(entries.map(([key], i) => [key, results[i]]))`).

This is also a `react-hooks/exhaustive-deps` violation masked by the existing `eslint-disable` comment — the effect references `urls` but only lists `urlKey`.

**Fix**: Either compute `urlEntries` inside the effect from `urlKey`, or memoize the `urls` object:
```typescript
useEffect(() => {
  const entries = urlKey.split("|").map(pair => {
    const [key, url] = pair.split(":");
    return [key, url] as [keyof T, string];
  });
  // use entries instead of urls...
}, [urlKey, refreshKey, ...deps]);
```

Or, more practically, add `urls` to the dependency array and remove `urlKey`:
```typescript
const urlsRef = useRef(urls);
urlsRef.current = urls;
// ...use urlsRef.current inside effect
```

### P1-6: Tables POST and table status query don't check `tables.status` for `"maintenance"` — maintenance tables can be seated

**Files**:
- `app/api/sessions/route.ts:82-105` — session creation checks for active session and reservations, but **not** table maintenance status
- `app/api/tables/route.ts:7-23` — status query only checks sessions and reservations
- `lib/types.ts:19` — `TableStatus` includes `"maintenance"`

**Issue**: The `TableStatus` type includes `"maintenance"` as a valid status, and `VALID_TABLE_STATUSES` in `lib/constants.ts:35` includes it. But no code ever:
1. Sets a table to `"maintenance"` (no UI or API endpoint for it)
2. Checks for `"maintenance"` when determining if a table can be seated

The table status is dynamically computed in the GET query (`tables/route.ts:7-20`) from sessions and reservations, which means the `status` column in the `tables` table is effectively ignored. If a table's DB status were manually set to `"maintenance"`, the GET query would override it to `"available"` (since there's no matching session or reservation), and a session could be created for it.

This is a half-implemented feature. The type system promises `"maintenance"` as a valid state, but the application has no way to enter or respect it.

**Fix**: Either:
1. **Implement it**: Add a maintenance toggle in the Tables UI that sets `tables.status = 'maintenance'` and update the table status query to respect it:
   ```sql
   CASE
     WHEN t.status = 'maintenance' THEN 'maintenance'
     WHEN EXISTS (...) THEN 'occupied'
     ...
   ```
2. **Remove it**: Drop `"maintenance"` from `TableStatus` and `VALID_TABLE_STATUSES` until it's needed.

---

## 5. Summary

| Priority | Count | Key Themes |
|---|---|---|
| **P0** | 1 | Tables POST route has zero validation for position, shape, section, uniqueness |
| **P1** | 6 | CheckInModal empty-tables crash, reservation time-slot overlap not modeled, game delete error swallowed, reservation save error message lost, `useMultiFetch` stale closure, maintenance status half-implemented |

All 7 findings are **genuinely new** — not re-flagged from any prior review.

---

## 6. Recommended Fix Order

### Day 1 — Validation & error surfacing (highest user impact)

1. **P0-1**: Add validation for all Tables POST fields + UNIQUE error handling — 20 min
2. **P1-3**: Surface API error messages in game DELETE handler — 2 min
3. **P1-4**: Surface API error messages in reservation save handler — 5 min
4. **P1-1**: Add empty-tables guard in CheckInModal — 5 min

### Day 2 — Logic & structural fixes

5. **P1-2**: Add time-window checks to reservation conflict queries — 30 min
6. **P1-6**: Either implement maintenance toggle or remove `"maintenance"` from types — 15 min (remove) or 1 hr (implement)
7. **P1-5**: Fix `useMultiFetch` stale closure by deriving entries from `urlKey` — 10 min

**Total estimated effort: ~1.5 hours** for all 7 findings.

---

## 7. Structural Gaps Unchanged Across 6 Reviews

These systemic gaps have been noted since Review 1:

1. **Zero test coverage**: No test runner, no test files, no CI. 14 API routes + ~30 components have no automated validation.
2. **No authentication or authorization**: All API routes and admin pages are publicly accessible.
3. **No multi-tenancy**: Database has no tenant/org/location scoping.

These are prerequisites for any pilot deployment and are not quick fixes.

---

## 8. Carryover P2s (Still Unfixed, Not Re-Flagged)

| Item | Since | Location |
|---|---|---|
| Toast ref cleanup ESLint warning | R3 | `Toast.tsx:35` — `timeoutRefs.current` in cleanup |
| Admin layout `role="main"` | R2 | `layout.tsx:50` — redundant on `<main>` |
| `useFetch` deps spread + eslint-disable | R4 | `useFetch.ts:71`, `useFetch.ts:157` |

---

## 9. What's Going Well

- **Onboarding**: Still best-in-class — `npm install && npm run dev`, auto-seeded DB, zero config.
- **TypeScript**: Clean `tsc --noEmit`, zero errors. Strict mode with `noUncheckedIndexedAccess` and `noUnusedLocals`.
- **ESLint**: Only 1 warning (Toast ref — known P2).
- **Data integrity**: All multi-write operations now use `db.transaction()`. Race conditions resolved via SQLite's serialized write transactions. TOCTOU patterns fixed in checkout, session creation, and RSVP flows.
- **Type safety**: Union types are tight (no `| string` escape hatches). `Pick<>` / `Omit<>` used for view projections.
- **Validation**: POST and PUT routes consistently use `lib/validation.ts` utilities. Enum validation covers events, reservations, games, and sessions.
- **Accessibility**: WCAG foundations solid — ARIA attributes, focus trap, `aria-pressed` toggles, `role="alert"`, `aria-label` on icon buttons, `prefers-reduced-motion`.
- **Code organization**: Excellent sub-component extraction. All pages under 250 LOC. Shared utilities well-centralized.
- **Constants**: Enum drift resolved. All API routes import from `lib/constants.ts`. No more local shadows or redeclarations.

---

*This audit was performed through static code analysis, `tsc --noEmit` (clean), and `eslint` (1 warning: Toast ref). The application was not run in-browser.*
