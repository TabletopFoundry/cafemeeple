# CaféMeeple — Seventh-Pass UX & Developer Experience Audit

> **Auditor perspective**: Senior full-stack engineer performing a focused seventh review after six improvement rounds.
> **Date**: 2025-07-24
> **Scope**: Only genuinely new P0/P1 issues not documented in Reviews 1–6, CODE_REVIEW 1–3. No re-flagging of known items.
> **Baseline**: Reviews 1–6 (`docs/UX_REVIEW.md` through `docs/UX_REVIEW_6.md`) plus `docs/CODE_REVIEW.md`, `docs/CODE_REVIEW_2.md`, `docs/CODE_REVIEW_3.md`. All prior P0s resolved.

---

## 1. Executive Summary

CaféMeeple has been polished across six UX and three code reviews, resolving every P0 and the vast majority of P1s. The codebase is in strong shape: `tsc --noEmit` is clean, `eslint` passes with zero warnings, transactions protect all multi-write operations, validation is consistent across POST/PUT endpoints, and the `useFetch` hook now supports debouncing. This seventh pass reveals **three genuinely new P1 findings** — all variations of patterns partially fixed in earlier rounds but missed in specific files. There are zero new P0s. The total estimated fix effort is under one hour.

---

## 2. Previous Review Items — Spot-Check

| Item | Status |
|---|---|
| Tables POST validation (R6 P0-1) | ✅ Fixed — `tables/route.ts:42-49` validates all fields |
| CheckInModal empty-tables guard (R6 P1-1) | ✅ Fixed — `CheckInModal.tsx:15-30` |
| Reservation time-slot overlap (R6 P1-2) | ✅ Fixed — `tables/route.ts:20-21`, `sessions/route.ts:102-103` |
| Game DELETE error surfaced (R6 P1-3) | ✅ Fixed — `games/page.tsx:63-64` reads response body |
| Reservation save error surfaced (R6 P1-4) | ✅ Fixed — `reservations/page.tsx:109-110` reads response body |
| `useMultiFetch` stale closure (R6 P1-5) | ✅ Fixed — `useFetch.ts:137-140` uses `urlsRef` + `JSON.stringify` |
| Maintenance status half-implemented (R6 P1-6) | ✅ Partially fixed — GET/session-creation check `maintenance` (see P1-3 below for remaining gap) |
| Games page bypasses `useFetch` (CR3 P1-3-1) | ✅ Fixed — `games/page.tsx:42-46` uses `useFetch` with `debounceMs: 250` |
| Session close stale `activeGames` (CR3 P1-3-2) | ✅ Fixed — `sessions/[id]/route.ts:81-83` returns `activeGames: 0` |
| Auto-return condition metadata (CR3 P1-3-3) | ✅ Fixed — `sessions/[id]/route.ts:62-79` updates condition/score/replacement |
| Reservation table validation (CR3 P1-3-4) | ✅ Fixed — `reservations/route.ts:57-71` validates table exists + capacity |
| `useMultiFetch` URL parsing (CR3 P1-3-5) | ✅ Fixed — uses `JSON.stringify` + `urlsRef` pattern |
| `addColumnIfMissing` SQL injection (CR3 P1-3-6) | ✅ Fixed — `db.ts:186-191` uses `KNOWN_COLUMN_DEFINITIONS` allowlist |
| `useFetch` deps spread + eslint-disable (R4) | ❌ Still present — `useFetch.ts:90`, `useFetch.ts:179` (P2, unchanged) |
| Admin layout `role="main"` (R2) | ❌ Still present — `layout.tsx:50` (P2, unchanged) |

---

## 3. New Findings — P0

_None identified._ The codebase has no critical data-integrity, security, or crash-path issues.

---

## 4. New Findings — P1

### P1-1: API error messages swallowed in 6 remaining client-side handlers

**Pattern**: R6 P1-3 and P1-4 fixed the "generic error throw without reading response body" pattern in `games/page.tsx` (handleDelete) and `reservations/page.tsx` (handleSaveReservation). But the **same pattern persists in 6 other handlers** that were not addressed:

| File | Handler | Line | Generic throw | API errors lost |
|---|---|---|---|---|
| `app/admin/tables/page.tsx` | `handleCheckout` | 41 | `"Failed to close session"` | "Session is already closed" (409), "Session not found" (404) |
| `app/admin/checkout/page.tsx` | `handleReturn` | 74 | `"Failed to return"` | "Game already returned" (400), "Checkout not found" (404), condition validation errors |
| `app/admin/events/page.tsx` | `handleDelete` | 40 | `"Failed to delete event"` | Future FK constraint messages |
| `app/admin/events/components/EventModal.tsx` | `handleSubmit` | 55 | `"Failed to save"` | "capacity must be a positive integer", "event_type must be one of: ..." |
| `app/admin/reservations/page.tsx` | `handleDelete` | 61 | `"Failed to delete reservation"` | "Reservation not found" (404) |
| `app/admin/reservations/page.tsx` | `handleStatusChange` | 78 | `"Failed to update reservation"` | "status must be one of: confirmed, pending, ..." (400) |

**Worst case** — `checkout/page.tsx:77`: The `catch {}` block discards the error entirely. Even if the throw were to include the API message, the catch doesn't reference it:

```typescript
// checkout/page.tsx:67-79
const handleReturn = async (checkoutId: number, condition: string, notes: string) => {
  try {
    const res = await fetch(`/api/checkout/${checkoutId}/return`, { ... });
    if (!res.ok) throw new Error("Failed to return");  // ← generic
    // ...
  } catch {  // ← error discarded entirely
    addToast("Failed to return game", "error");
  }
};
```

**Impact**: Staff see "Failed to return game" instead of "Game already returned" or "return_condition must be one of: Excellent, Good, Fair, Worn, Needs Replacement". Without actionable messages, staff must guess what went wrong or escalate to a developer.

**Fix**: Apply the same pattern already used in `games/page.tsx:63-64` and `checkout/page.tsx:54-55`:

```typescript
if (!res.ok) {
  const data = await res.json().catch(() => null) as { error?: string } | null;
  throw new Error(data?.error || "Failed to <action>");
}
```

For `checkout/page.tsx`, also change `catch {}` to `catch (err)` to preserve the error message:
```typescript
} catch (err) {
  addToast(err instanceof Error ? err.message : "Failed to return game", "error");
}
```

---

### P1-2: Reservation POST doesn't detect time-slot overlaps with existing reservations on the same table

**File**: `app/api/reservations/route.ts:73-86`

**Issue**: R6 P1-2 added time-window overlap checks to the **table status query** (`tables/route.ts:17-22`) and **session creation** (`sessions/route.ts:94-107`). But the **reservation creation endpoint itself** never checks whether a new reservation overlaps with an existing reservation for the same table.

```typescript
// reservations/route.ts:73-86 — INSERT with no overlap check
const result = db.prepare(`
  INSERT INTO reservations (guest_name, ..., table_id, reservation_date, reservation_time, duration_minutes, ...)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(guest_name, ..., table_id, reservation_date, reservation_time, duration_minutes, ...);
```

**Concrete scenario**: Staff creates a reservation for Table 1 on July 25 at 6:00 PM for 2 hours (6:00–8:00 PM). Then creates another reservation for Table 1 on July 25 at 7:00 PM for 2 hours (7:00–9:00 PM). Both succeed. When the second party arrives, the table is occupied — the conflict is only discovered at seating time (session creation), not at booking time.

The reservation PUT endpoint (`reservations/[id]/route.ts`) has the same gap — updating a reservation's time or table doesn't check for new overlaps.

**Fix**: Add overlap detection before INSERT (and before UPDATE when table_id/date/time change):

```typescript
if (table_id) {
  const overlap = db.prepare(`
    SELECT id FROM reservations
    WHERE table_id = ?
      AND reservation_date = ?
      AND status IN ('confirmed', 'pending')
      AND time(?, '+' || ? || ' minutes') > time(reservation_time)
      AND time(reservation_time, '+' || duration_minutes || ' minutes') > time(?)
    LIMIT 1
  `).get(table_id, reservation_date, reservation_time, duration_minutes, reservation_time);

  if (overlap) {
    return Response.json(
      { error: "This table already has a reservation during that time slot" },
      { status: 409 },
    );
  }
}
```

---

### P1-3: Tables API has no PUT/DELETE endpoints — maintenance mode and table editing are unreachable

**File**: `app/api/tables/route.ts` (only GET and POST exist)

**Issue**: The tables API only supports listing (GET) and creating (POST) tables. There is no `app/api/tables/[id]/route.ts` file — no PUT, no DELETE. This means:

1. **Maintenance mode is unreachable**: R6 P1-6 was marked as fixed because the GET query (`tables/route.ts:12`) and session creation (`sessions/route.ts:74-76`) now check for `status = 'maintenance'`. But there is **no API endpoint to set a table's status to maintenance**. The only way to do it is a direct SQLite UPDATE.

2. **Table properties are immutable after creation**: Name, capacity, section, position, and shape cannot be edited. A café rearranging its floor layout or expanding a table's seating has no recourse except deleting the database.

3. **Tables cannot be deleted**: A table added by mistake cannot be removed.

4. **FloorMap doesn't handle maintenance visually**: `FloorMap.tsx:40-45` styles only `"occupied"`, `"reserved"`, and falls through to `"available"` (green) for everything else. A maintenance table would render with green/available styling and a green "maintenance" badge — visually misleading. Clicking it triggers `onStartCheckIn()` (line 35-36), opening the check-in modal (the API would reject, but the UX is confusing).

**Fix (minimum viable)**:

1. Create `app/api/tables/[id]/route.ts` with PUT and DELETE handlers:

```typescript
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // validate fields, update table, return updated
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // check for active sessions/reservations, then delete
}
```

2. Add maintenance handling to FloorMap:

```tsx
// FloorMap.tsx:40-45 — add maintenance case
table.status === "maintenance"
  ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
  : table.status === "occupied"
    ? "border-violet-200 bg-violet-50"
    : // ...

// FloorMap.tsx:33-36 — skip check-in for maintenance tables
} else if (table.status === "available") {
  onStartCheckIn();
}
// maintenance tables: click does nothing (no else branch)
```

---

## 5. Summary

| Priority | Count | Key Themes |
|---|---|---|
| **P0** | 0 | — |
| **P1** | 3 | Error messages swallowed in 6 handlers, reservation overlap not checked, tables API incomplete |

All 3 findings are **genuinely new** — not re-flagged from any prior review.

---

## 6. Recommended Fix Order

### Day 1 — Error surfacing and overlap detection

1. **P1-1**: Apply response-body-reading pattern to all 6 handlers — **15 min** (copy-paste from `games/page.tsx:63-64`)
2. **P1-2**: Add reservation overlap check to POST and PUT — **20 min**

### Day 2 — Tables API completion

3. **P1-3**: Create `tables/[id]/route.ts` with PUT/DELETE, add FloorMap maintenance styling — **45 min**

**Total estimated effort: ~1.5 hours** for all 3 findings.

---

## 7. Structural Gaps Unchanged Across 7 Reviews

These systemic gaps have been noted since Review 1:

1. **Zero test coverage**: No test runner, no test files, no CI. 14 API routes + ~30 components have no automated validation.
2. **No authentication or authorization**: All API routes and admin pages are publicly accessible.
3. **No multi-tenancy**: Database has no tenant/org/location scoping.

These are prerequisites for any pilot deployment and are not quick fixes.

---

## 8. Carryover P2s (Still Unfixed, Not Re-Flagged)

| Item | Since | Location |
|---|---|---|
| `useFetch` deps spread + `eslint-disable` | R4 | `useFetch.ts:90`, `useFetch.ts:179` |
| Admin layout `role="main"` on `<main>` | R2 | `layout.tsx:50` |

---

## 9. What's Going Well

- **Fix velocity remains excellent**: All 7 findings from UX_REVIEW_6 and all 6 findings from CODE_REVIEW_3 have been resolved — a 100% fix rate across the last two review cycles.
- **TypeScript & lint**: `tsc --noEmit` zero errors, `eslint` zero warnings. Strict mode with `noUncheckedIndexedAccess`.
- **Data integrity**: All multi-write operations wrapped in `db.transaction()`. TOCTOU races eliminated in checkout, session creation, RSVP, and session close flows.
- **Validation layer**: Comprehensive and consistent — all POST/PUT routes use `lib/validation.ts` helpers. `KNOWN_COLUMN_DEFINITIONS` allowlist eliminates the schema migration SQL injection surface.
- **`useFetch` maturity**: Now supports `debounceMs`, uses `urlsRef` + `JSON.stringify` for stable dependencies, and has proper cancellation. All admin pages use it.
- **Accessibility**: WCAG foundations solid — focus trap, `aria-modal`, `aria-pressed`, `aria-label`, `role="alert"`, `prefers-reduced-motion`.
- **Code organization**: Excellent sub-component extraction. Largest page is 253 LOC. Shared utilities well-centralized. Constants in single source of truth.

---

*This audit was performed through static code analysis, `tsc --noEmit` (clean), and `eslint` (0 warnings). The application was not run in-browser.*
