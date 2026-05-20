# UX Coverage Audit — CaféMeeple

Fresh fourth-pass audit of the **current** Next.js 16 App Router codebase. This pass re-reviewed the landing flow, admin workspaces, modal workflows, empty states, and API guardrails across `app/**`, `components/**`, `hooks/useFetch.ts`, `lib/types.ts`, and the relevant route handlers under `app/api/**`.

Previously audited fixes were verified as still landed and are **not** re-opened in this report: truthful seeded-demo positioning (`app/page.tsx`), game filter reset/recovery (`app/admin/games/page.tsx`, `app/admin/games/components/GameFilterBar.tsx`), filter-aware reservation zero states (`app/admin/reservations/page.tsx`, `app/admin/reservations/components/ReservationList.tsx`, `app/admin/reservations/components/ReservationCalendar.tsx`), check-in capacity clamping (`app/admin/tables/components/CheckInModal.tsx`), mobile drawer affordances (`app/admin/layout.tsx`), and operator-oriented admin copy (`app/admin/page.tsx`, `app/admin/checkout/page.tsx`, `app/admin/tables/**`).

This fresh pass still found **5 actionable UX issues** on the current build: reservation table assignment ignores live serviceability cues, checkout history truncates older returns, sold-out events still advertise RSVP entry, the floor map preselects an arbitrary table, and reservation status updates complete silently.

## Phase 1 — Feature Inventory by Domain

### Marketing & Entry
1. **Landing page / admin handoff** — seeded-demo positioning and CTA into `/admin` (`app/page.tsx`).

### Admin Shell & Shared UI
2. **Admin layout shell** — mobile menu, sidebar navigation, page framing (`app/admin/layout.tsx`, `components/Sidebar.tsx`).
3. **Shared feedback primitives** — empty states, badges, stat cards, error messages (`components/ui.tsx`, `components/Toast.tsx`).

### Dashboard & Library
4. **Dashboard KPIs and alerts** — seeded data status, revenue mix, upcoming events, popular games (`app/admin/page.tsx`, `app/api/dashboard/route.ts`, `app/api/seed/route.ts`).
5. **Game library browse and maintenance** — filters, grid/list views, add/edit/remove flows (`app/admin/games/page.tsx`, `app/admin/games/components/**`, `app/api/games/**`).

### Tables, Sessions, and Billing
6. **Floor operations** — floor map, active list, session history, table management (`app/admin/tables/page.tsx`, `app/admin/tables/components/FloorMap.tsx`, `TableList.tsx`, `SessionHistoryTable.tsx`, `TableManagement.tsx`).
7. **Check-in / checkout** — new party seating and billing closeout (`app/admin/tables/components/CheckInModal.tsx`, `CheckoutModal.tsx`, `app/api/sessions/**`).
8. **Table editing** — capacity, section, coordinates, maintenance mode (`app/admin/tables/components/TableEditorModal.tsx`, `app/api/tables/**`).

### Checkout Ledger
9. **Game assignment** — active session selection plus searchable game combobox (`app/admin/checkout/page.tsx`, `app/admin/checkout/components/CheckoutForm.tsx`, `app/api/checkout/route.ts`).
10. **Active and historical records** — active ledger, return flow, returned history (`app/admin/checkout/components/CheckoutTable.tsx`, `CheckoutHistory.tsx`, `ReturnModal.tsx`, `app/api/checkout/[id]/return/route.ts`).

### Reservations & Events
11. **Reservation filtering and CRUD** — date/status/search filters, list/calendar views, modal-backed create/edit/delete (`app/admin/reservations/page.tsx`, `app/admin/reservations/components/**`, `app/api/reservations/**`).
12. **Event catalog and RSVP management** — event cards, create/edit modal, attendee add/remove flows (`app/admin/events/page.tsx`, `app/admin/events/components/**`, `app/api/events/**`).

## Phase 2 — Coverage Table

| # | Feature | Domain | Coverage | Notes |
| --- | --- | --- | --- | --- |
| 1 | Seeded-demo landing flow | Marketing | [COVERED] | `app/page.tsx` truthfully frames the current product as an admin demo. |
| 2 | Admin shell navigation and mobile drawer | Shell | [COVERED] | `app/admin/layout.tsx` and `components/Sidebar.tsx` include the prior pass accessibility fixes. |
| 3 | Dashboard KPI, alert, and seed visibility | Dashboard | [COVERED] | Dashboard and seed-status flows are coherent in `app/admin/page.tsx`, `app/api/dashboard/route.ts`, and `app/api/seed/route.ts`. |
| 4 | Game library browse, recovery, and CRUD | Games | [COVERED] | Filter reset, active-filter feedback, and modal CRUD are present in `app/admin/games/**`. |
| 5 | Floor map table detail flow | Tables | [PARTIAL] | `FloorMap.tsx` still falls back to the first table when nothing is selected, which makes the detail pane look pre-confirmed. |
| 6 | Table management and editing | Tables | [COVERED] | Manage/edit surfaces are understandable and operator-oriented after prior clean-up. |
| 7 | Check-in and billing closeout | Tables | [COVERED] | Capacity-aware check-in plus session closeout are solid in `CheckInModal.tsx` and `app/api/sessions/**`. |
| 8 | Game checkout assignment | Checkout | [COVERED] | Session/game selection and return validation are intact. |
| 9 | Checkout history reachability | Checkout | [PARTIAL] | `app/admin/checkout/page.tsx` still slices returned history to 50 rows, while `app/api/checkout/route.ts` caps the feed at 150. |
| 10 | Reservation filters, zero states, and CRUD | Reservations | [PARTIAL] | Empty-state recovery is fixed, but manual table assignment does not distinguish live table states and status changes still complete silently. |
| 11 | Event cards and event CRUD | Events | [COVERED] | Event catalog and edit flows remain complete in `app/admin/events/**`. |
| 12 | RSVP availability feedback | Events | [PARTIAL] | `RsvpModal.tsx` explains remaining seats, but the add flow still advertises RSVP entry when the event is already full. |

## Phase 3 — Quality Findings & Severities

### 1. Manual reservation table assignment hides live table state `[MAJOR]`
**Criterion:** Error prevention / scheduling clarity  
**Problem:** `ReservationModal.tsx` renders every table as a plain option, so staff cannot tell which tables are currently occupied, reserved, or under maintenance when they manually pin a reservation. The reservation API routes only enforce capacity and reservation overlap; they do not block maintenance tables, so a booking can still be assigned to a blocked table with no warning.  
**Concrete paths:** `app/admin/reservations/components/ReservationModal.tsx`, `app/api/reservations/route.ts`, `app/api/reservations/[id]/route.ts`, `app/api/tables/route.ts`

### 2. Returned checkout history is still truncated `[MAJOR]`
**Criterion:** Traceability / auditability  
**Problem:** The checkout page only renders `pastCheckouts.slice(0, 50)` while the API itself hard-caps the ledger response at 150 rows. Older return records become unreachable in the UI even when operators are explicitly filtering the ledger to investigate a past checkout.  
**Concrete paths:** `app/admin/checkout/page.tsx`, `app/api/checkout/route.ts`

### 3. Sold-out event RSVPs still look actionable `[MODERATE]`
**Criterion:** Feedback / error prevention  
**Problem:** `RsvpModal.tsx` correctly calculates remaining seats, but the “Add RSVP” affordance stays available until the user tries to submit. The API then rejects the request for capacity, turning a known sold-out state into a preventable error path.  
**Concrete paths:** `app/admin/events/components/RsvpModal.tsx`, `app/api/events/[id]/rsvps/route.ts`

### 4. The floor map preselects an arbitrary table `[MODERATE]`
**Criterion:** Information scent / orientation  
**Problem:** `FloorMap.tsx` falls back to `tables[0]` whenever no explicit selection exists. That makes the detail panel appear authoritative on first load even though the operator has not chosen any table yet.  
**Concrete paths:** `app/admin/tables/components/FloorMap.tsx`

### 5. Reservation status changes complete with no success feedback `[LOW]`
**Criterion:** System feedback  
**Problem:** `handleStatusChange` in `app/admin/reservations/page.tsx` refreshes the list after confirm / no-show actions, but it never surfaces a success toast. The buttons feel silent compared with the add/edit/delete flows on the same screen.  
**Concrete paths:** `app/admin/reservations/page.tsx`

## Phase 4 — Remediations with Effort

| # | Remediation | Effort | Target paths |
| --- | --- | --- | --- |
| 1 | Make reservation table choices status-aware, disable or reject maintenance-table assignment, and add inline guidance when a selected table is currently in service. | [S] | `app/admin/reservations/components/ReservationModal.tsx`, `app/admin/reservations/page.tsx`, `app/api/reservations/route.ts`, `app/api/reservations/[id]/route.ts` |
| 2 | Remove the local 50-row history cap, let the checkout API honor larger limits, and add a load-more path so older return records remain reachable. | [S] | `app/admin/checkout/page.tsx`, `app/api/checkout/route.ts` |
| 3 | Disable RSVP entry when an event is full (and close server-side registration for unavailable events) so operators never start a known-bad add flow. | [XS] | `app/admin/events/components/RsvpModal.tsx`, `app/api/events/[id]/rsvps/route.ts` |
| 4 | Replace the floor-map default detail pane with an explicit “select a table” state until the operator actually chooses one. | [XS] | `app/admin/tables/components/FloorMap.tsx` |
| 5 | Add affirmative toast feedback for reservation lifecycle actions such as confirm and no-show. | [XS] | `app/admin/reservations/page.tsx` |

## Phase 5 — Stack Rank + Quick Wins

### Quick Wins

| Rank | Remediation | Why now |
| --- | --- | --- |
| 1 | Sold-out RSVP guardrails | Tiny change with immediate reduction in avoidable operator errors. |
| 2 | Floor-map explicit selection | Quick clarity win that removes a misleading default state on a high-traffic page. |
| 3 | Reservation status success feedback | Very small change that makes lifecycle actions feel reliable and complete. |

### Full Stack Rank

| Rank | Item | Severity | Effort | Rationale |
| --- | --- | --- | --- | --- |
| 1 | Reservation table serviceability cues and guardrails | [MAJOR] | [S] | Prevents staff from pinning bookings to blocked tables and makes live table state visible during assignment. |
| 2 | Checkout history reachability | [MAJOR] | [S] | The ledger is an operational record; older returns must stay reachable when staff investigate past activity. |
| 3 | Sold-out RSVP guardrails | [MODERATE] | [XS] | Removes an avoidable submit-and-fail loop from the events workflow. |
| 4 | Floor-map explicit selection | [MODERATE] | [XS] | Stops the interface from implying an operator choice that never happened. |
| 5 | Reservation status success feedback | [LOW] | [XS] | Small polish improvement that aligns status buttons with the rest of the app’s feedback model. |

## Implementation Status

**Status:** 2 of 5 remediations complete.

- [x] Make reservation table choices status-aware and block maintenance-table assignment.
- [x] Expose older checkout history beyond the 50-row UI cap.
- [ ] Disable RSVP entry for sold-out or unavailable events before submit.
- [ ] Require explicit floor-map selection before showing table details.
- [ ] Add success feedback for reservation status changes.

### Baseline validation completed before edits

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm run test`
