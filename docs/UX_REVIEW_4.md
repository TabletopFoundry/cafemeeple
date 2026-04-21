# CaféMeeple — Fourth-Pass UX & Developer Experience Audit

> **Auditor perspective**: Senior full-stack engineer performing a focused fourth review after three improvement rounds.
> **Date**: 2025-07-18
> **Scope**: Only genuinely new P0/P1 issues not documented in Reviews 1–3. No re-flagging of known items.
> **Baseline**: Reviews 1–3 (`docs/UX_REVIEW.md`, `docs/UX_REVIEW_2.md`, `docs/UX_REVIEW_3.md`) — all previous P0s are resolved. Modal ARIA/focus-trap, Toast system, ConfirmDialog, responsive sidebar, skeleton loading, combobox keyboard nav, `aria-pressed`, body scroll lock, `prefers-reduced-motion`, `usePageTitle`, `seedDatabase` moved out of layout, footer year dynamic, session close confirmation, inline validation on Event/Reservation/Game modals, `res.ok` checks on mutations — all done.

---

## 1. Executive Summary

CaféMeeple has been steadily improved across three review rounds and the critical UX/a11y foundations are solid. This fourth pass focuses exclusively on issues **not flagged in any prior review**. The findings concentrate in two areas: **(1) data integrity risks** from non-transactional writes and missing idempotency guards in the session close API, and **(2) validation parity gaps** where PUT routes silently skip the validation their corresponding POST routes enforce. A secondary cluster of findings covers DX inconsistencies — duplicated utility functions, reversed button order in two modals not previously caught, and a data-fetch hook that isn't used consistently. There are zero new accessibility blockers. The codebase is demo-ready and approaching pilot-ready; these findings close the gap.

---

## 2. Previous Review Items — Quick Spot-Check

| Item | Status |
|---|---|
| Footer year dynamic (R1 QW-9) | ✅ Fixed — `{new Date().getFullYear()}` at `page.tsx:255` |
| `seedDatabase()` out of layout (R1 QW-7 / R2 P0-4) | ✅ Fixed — runs via `ensureSeedData()` in `getDb()` |
| Per-page `<title>` (R1 QW-8) | ✅ Fixed — `usePageTitle()` hook used on all 6 admin pages |
| `prefers-reduced-motion` (R3 P1-8) | ✅ Fixed — CSS media query in `globals.css:56-61` |
| Session close ConfirmDialog (R2 P1-11) | ✅ Fixed — two-step flow in `CheckoutModal.tsx:66-78` |
| Inline validation on modals (R2 P1-5) | ✅ Fixed — `GameModal`, `EventModal`, `ReservationModal` all have `validate()` + inline errors |
| Checkout/History tables `overflow-x-auto` (R3 P1-6/P1-7) | ✅ Fixed — `CheckoutTable.tsx:13`, `CheckoutHistory.tsx:18` |
| ESLint Toast ref warning (R3 P2-15) | ❌ Still present — `Toast.tsx:36` (P2, unchanged) |
| `ErrorMessage` missing `role="alert"` (R2 P2-11 / R3 P2-3) | ❌ Still `<div>` at `ui.tsx:55` (P2, unchanged) |
| `EmptyState` emoji `aria-hidden` (R2 P2-10 / R3 P2-4) | ❌ Still plain text at `ui.tsx:39` (P2, unchanged) |
| Admin layout redundant `role="main"` (R2 P2-17 / R3 P2-6) | ❌ Still present at `layout.tsx:50` (P2, unchanged) |

---

## 3. New Findings — P0

### P0-1: Session close writes are not transactional — data corruption on partial failure

**File**: `app/api/sessions/[id]/route.ts:46-57`

**Issue**: The session close handler performs three independent write operations:
1. `UPDATE sessions SET status = 'completed' ...` (line 46-48)
2. `UPDATE tables SET status = 'available' ...` (line 50)
3. `UPDATE game_checkouts SET returned_at = ... WHERE returned_at IS NULL` (line 51-57)

These are **not wrapped in a `db.transaction()`**. If any write fails (e.g., disk full, SQLite busy lock), the database is left in an inconsistent state. Concrete failure scenarios:
- Session marked `completed` but table still shows `occupied` — the table is permanently stuck.
- Session marked `completed` and table freed, but game checkouts not auto-returned — `copies_available` count is permanently decremented, showing games as "unavailable" when they're not.

This is distinct from the RSVP race condition (R3 P2-18). The session close is a far more frequent operation (happens every table turn) and the consequences are worse (stuck tables, phantom inventory loss).

**Fix**: Wrap all three writes in a single `db.transaction()`, matching the pattern already used in `POST /api/sessions` (line 107-116) and `POST /api/checkout` (line 64-73):
```typescript
const closeTx = db.transaction(() => {
  db.prepare(`UPDATE sessions SET status = 'completed', ended_at = datetime('now'), total_charge = ? WHERE id = ?`).run(total, id);
  db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(session.table_id);
  db.prepare(`UPDATE game_checkouts SET returned_at = datetime('now'), return_condition = COALESCE(return_condition, 'Good') WHERE session_id = ? AND returned_at IS NULL`).run(id);
});
closeTx();
```

### P0-2: Session close has no idempotency guard — double-close corrupts table state

**File**: `app/api/sessions/[id]/route.ts:17-31`

**Issue**: The PUT handler fetches the session (line 17-22) but **never checks `session.status`**. A session that's already `completed` can be "closed" again. The consequences:
1. `total_charge` is recalculated and overwritten (may differ from original if pricing changed).
2. `tables.status` is set to `available` — but the table may now be occupied by a *different* active session, and this call clobbers that session's table status.
3. `game_checkouts` with `returned_at IS NULL` for the old session ID is a no-op (games already returned), but `ended_at` is reset to `datetime('now')`, losing the original close timestamp.

This is exploitable through any race condition (user double-clicks "Close session" quickly, network retry sends duplicate PUT) or through direct API calls.

**Fix**: Add a status check after fetching the session:
```typescript
if (session.status !== 'active') {
  return Response.json({ error: "Session is already closed" }, { status: 409 });
}
```

### P0-3: PUT routes skip validation that their POST routes enforce — invalid data enters DB on update

**Files**:
- `app/api/events/[id]/route.ts:3-31` — PUT has zero validation
- `app/api/reservations/[id]/route.ts:3-32` — PUT has zero validation
- `app/api/games/[id]/route.ts:42-110` — PUT has zero validation

**Issue**: The POST routes for events, reservations, and games all use `lib/validation.ts` utilities (`validatePositiveInt`, `validateEnum`, `validateRange`, `firstError`) to reject invalid input. But their corresponding PUT routes accept **any value** for any field without validation.

Concrete examples of what PUT accepts but POST rejects:
- `PUT /api/events/:id` with `{ capacity: -10 }` → accepted (POST rejects via `validatePositiveInt`)
- `PUT /api/events/:id` with `{ event_type: "INVALID" }` → accepted (POST rejects via `validateEnum`)
- `PUT /api/events/:id` with `{ status: "hacked" }` → accepted (POST rejects via `validateEnum`)
- `PUT /api/reservations/:id` with `{ party_size: -5 }` → accepted (POST rejects via `validatePositiveInt`)
- `PUT /api/games/:id` with `{ min_players: -1, complexity: 999 }` → accepted (POST rejects via `validateRange`/`validatePositiveInt`)

Since the admin UI lets users edit every entity, every edit form submission goes through the PUT route, making this the primary write path. Invalid data enters the database and causes display issues (negative counts, broken badge rendering, analytics anomalies).

**Fix**: Apply the same validation checks from each POST handler to the corresponding PUT handler. Extract shared validation logic into per-entity validator functions to avoid duplication:
```typescript
// In events PUT handler, before the update:
const validationError = firstError(
  validatePositiveInt(body.capacity, "capacity"),
  validateEnum(body.event_type, "event_type", VALID_EVENT_TYPES),
  validateEnum(body.status, "status", VALID_EVENT_STATUSES),
);
if (validationError) {
  return Response.json({ error: validationError }, { status: 400 });
}
```

---

## 4. New Findings — P1

### P1-1: EventModal and ReservationModal button order reversed from app convention

**Files**: `app/admin/events/components/EventModal.tsx:163-177`, `app/admin/reservations/components/ReservationModal.tsx:201-216`

**Issue**: Review 3 flagged the ReturnModal for having reversed button order (P1-5), and that was fixed. But **EventModal** and **ReservationModal** have the exact same issue that was never flagged:

```tsx
// EventModal.tsx:163-177 — primary FIRST, cancel SECOND
<div className="flex gap-3 pt-2">
  <button type="submit" ...>Create Event</button>     {/* ← Primary first */}
  <button type="button" onClick={onClose}>Cancel</button>  {/* ← Cancel second */}
</div>
```

Every other modal in the app (GameModal, CheckInModal, CheckoutModal, ConfirmDialog, ReturnModal) follows the convention: **Cancel left, primary action right, with `flex justify-end gap-3`**. EventModal and ReservationModal are the only two that break this pattern.

This inconsistency is especially confusing because a user who edits a game (Cancel left) and then creates an event (Cancel right) has to re-learn button positions within the same session.

**Fix**: In both modals, swap button order and add `justify-end`:
```tsx
<div className="flex justify-end gap-3 pt-2">
  <button type="button" onClick={onClose} className="...border...">Cancel</button>
  <button type="submit" className="...bg-violet-600...">Create Event</button>
</div>
```

### P1-2: ReservationList table lacks `overflow-x-auto` — clips on mobile

**File**: `app/admin/reservations/components/ReservationList.tsx:62`

**Issue**: Review 3 flagged CheckoutTable (P1-6) and CheckoutHistory (P1-7) for missing `overflow-x-auto`, and both were fixed. But ReservationList has the same 6-column table (Guest, Date & Time, Party, Table, Status, Actions) with `overflow-hidden` but **no `overflow-x-auto`**. On mobile viewports (< 640px), the rightmost columns (Status, Actions) are clipped and unreachable — the user cannot confirm, no-show, edit, or delete reservations on mobile.

The Actions column contains the status change buttons (Confirm, No-show) and the Edit/Delete buttons. Losing these on mobile is a functional gap, not just a visual one.

**Fix**: Change `overflow-hidden` to `overflow-x-auto` on the wrapper `<div>`:
```tsx
<div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
```

### P1-3: RsvpModal add form has no validation, no loading state, and prematurely clears input

**File**: `app/admin/events/components/RsvpModal.tsx:21-28`

**Issue**: Three compounding problems in the RSVP add form:

1. **No validation**: `handleAdd` at line 21 only checks `if (!name) return`. No email format validation, no party_size minimum check (user can enter 0 or negative). The API route (`/api/events/[id]/rsvps`) doesn't validate party_size either — negative values are accepted and corrupt the rsvp_count/capacity calculations.

2. **No loading state**: The "Add RSVP" button has no disabled/loading state during the async API call. Users can click it multiple times, creating duplicate RSVPs. This compounds with the RSVP race condition (R3 P2-18) since each click fires an independent capacity check.

3. **Premature state clearing**: `handleAdd` calls `onAddRsvp(...)` (which is async) and then immediately clears all form state (lines 24-27: `setName("")`, `setEmail("")`, etc.) and hides the form (`setShowAdd(false)`). If the API call fails, the user has lost their input. The parent catches the error and shows a toast, but the data is gone.

**Fix**:
```typescript
const handleAdd = async () => {
  if (!name.trim()) return;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  if (partySize < 1) return;
  setSaving(true);
  try {
    await onAddRsvp(event.id, name, email, partySize);
    setName(""); setEmail(""); setPartySize(1); setShowAdd(false);
  } finally {
    setSaving(false);
  }
};
```

### P1-4: Dashboard page manually reimplements `useFetch` instead of using the shared hook

**File**: `app/admin/page.tsx:24-59`

**Issue**: The dashboard page manually implements the exact `useFetch` pattern — `useState` for data/loading/error, `useEffect` with cancellation flag, `refreshKey` counter. This is identical to the `useFetch<DashboardData>("/api/dashboard")` call that the hook from `hooks/useFetch.ts` provides.

Every other admin page uses the shared hooks:
- Games page: manual fetch but with the debounced search pattern (justified divergence)
- Tables page: `useMultiFetch` (line 22-25)
- Checkout page: `useMultiFetch` (line 34-38)
- Events page: `useFetch` (line 24)
- Reservations page: `useMultiFetch` (line 47-53)

The dashboard is the only page that reimplements from scratch. This is a DX inconsistency — a new contributor looking at the dashboard won't discover the hook, and bugs fixed in the hook (e.g., missing `cancelled` check on `setLoading`) won't propagate to the dashboard.

**Fix**: Replace lines 24-59 with:
```typescript
const { data, loading, error, refresh } = useFetch<DashboardData>("/api/dashboard");
```

### P1-5: `formatElapsed` utility duplicated verbatim in 3 files

**Files**:
- `app/admin/tables/components/FloorMap.tsx:93-98`
- `app/admin/tables/components/CheckoutModal.tsx:83-89`
- `app/admin/tables/components/TableList.tsx:83-89`

**Issue**: The exact same function — same name, same logic, same output format — is copy-pasted in 3 files:
```typescript
function formatElapsed(startedAt: string) {
  const start = new Date(startedAt.replace(" ", "T"));
  const diffMs = Date.now() - start.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
```

If the date format changes (e.g., the DB starts storing ISO 8601 with `T`), or the display format needs updating (e.g., adding seconds), three files need identical edits. This is a maintenance burden and a DX smell — it signals to new contributors that local utilities are the convention, discouraging shared code.

**Fix**: Extract to `lib/date-utils.ts` and import from all three files.

### P1-6: `useFetch` deps spread disables exhaustive-deps lint and risks infinite re-renders

**File**: `hooks/useFetch.ts:49-50`, `hooks/useFetch.ts:111-112`

**Issue**: Both `useFetch` and `useMultiFetch` spread a caller-provided `deps` array directly into the `useEffect` dependency list:
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [url, refreshKey, ...deps]);
```

This has two problems:
1. **Lint suppression**: The `eslint-disable` silences `react-hooks/exhaustive-deps`, removing the safety net that catches stale closure bugs across the entire effect.
2. **Infinite loop risk**: If a consumer passes an unstable reference (e.g., `[{ filter: "abc" }]` created inline), the dependency changes on every render, causing an infinite fetch loop. There's no documentation warning about this, and no runtime guard.

Currently no consumer passes `deps` (all call sites use the default `[]`), so this is latent — but the API is public and invites misuse.

**Fix**: Either remove the `deps` parameter entirely (no caller uses it), or serialize deps to a stable key:
```typescript
const depsKey = JSON.stringify(deps);
useEffect(() => { ... }, [url, refreshKey, depsKey]);
```

---

## 5. Summary

| Priority | Count | Key Themes |
|---|---|---|
| **P0** | 3 | Session close not transactional, session close double-fire, PUT routes skip validation |
| **P1** | 6 | Button order in 2 modals, ReservationList mobile overflow, RSVP form validation/loading, Dashboard hook duplication, `formatElapsed` duplication, `useFetch` deps spread |

All 9 findings are **genuinely new** — not re-flagged from any prior review.

---

## 6. Recommended Fix Order

### Day 1 — Data integrity (P0s)
1. **P0-1**: Wrap session close writes in `db.transaction()` — 5 min
2. **P0-2**: Add `session.status !== 'active'` guard with 409 response — 2 min
3. **P0-3**: Copy validation from POST to PUT for events, reservations, games — 30 min

### Day 2 — Consistency & polish (P1s)
4. **P1-1**: Swap button order in EventModal + ReservationModal — 5 min
5. **P1-2**: Change `overflow-hidden` to `overflow-x-auto` in ReservationList — 1 min
6. **P1-3**: Add validation + loading + await to RsvpModal handleAdd — 15 min
7. **P1-4**: Replace dashboard manual fetch with `useFetch` hook — 10 min
8. **P1-5**: Extract `formatElapsed` to `lib/date-utils.ts` — 10 min
9. **P1-6**: Remove unused `deps` param from `useFetch`/`useMultiFetch` or serialize it — 5 min

**Total estimated effort: ~1.5 hours** for all 9 findings.

---

## 7. Structural Gaps Unchanged Across 4 Reviews

These have been noted in every review and remain the top-level architectural gaps:

1. **Zero test coverage**: No test runner, no test files, no CI. 14 API routes + ~30 components have no automated validation.
2. **No authentication or authorization**: All API routes and admin pages are publicly accessible.
3. **No multi-tenancy**: Database has no tenant/org/location scoping.

These are prerequisites for any pilot deployment and are not quick fixes.

---

*This audit was performed through static code analysis, `tsc --noEmit` (clean), and `eslint` (1 warning: Toast ref in cleanup). The application was not run in-browser.*
