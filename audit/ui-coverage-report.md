# UX Coverage Audit — CaféMeeple

Fresh third-pass audit of the **current** Next.js 16 App Router codebase. Setup completed with `find . -type f`, the root `package.json`, route inventory under `app/**`, shared UI under `components/**`, data/validation under `lib/**`, and environment/config review in `.env.example`, `next.config.ts`, `lib/db.ts`, and `app/api/seed/route.ts`. There is **no runtime feature-flag system** in the product UI today; the only behavior gates are dev-only seeding (`app/api/seed/route.ts`, `lib/db.ts`) and the optional `NEXT_PUBLIC_BASE_URL` env var in `.env.example`.

The shipped surface is broad and cohesive, but this fresh pass still found **5 actionable UX issues** on the current codebase: misleading demo marketing, weak game-filter recovery, filter-unaware reservation empty states, check-in capacity drift, and developer-centric admin copy leaking into operator UI.

## Phase 1 — Feature Inventory by Domain

### Marketing & Entry
1. **Landing page / entry route** — hero, feature cards, stats, demo CTA, marketing sections (`app/page.tsx`).
2. **Public-to-admin handoff** — direct jump into `/admin` from desktop and mobile CTAs (`app/page.tsx`).

### Admin Shell & Shared UI
3. **Admin layout shell** — mobile header, sidebar, page framing (`app/admin/layout.tsx`, `components/Sidebar.tsx`).
4. **Shared feedback primitives** — modal, confirm dialog, toast, error boundary, empty/error/loading states (`components/Modal.tsx`, `components/ConfirmDialog.tsx`, `components/Toast.tsx`, `components/ErrorBoundary.tsx`, `components/ui.tsx`).

### Dashboard & Ops Visibility
5. **Dashboard KPIs and alerts** — active tables, checkouts, revenue, visitors, alert cards (`app/admin/page.tsx`, `app/api/dashboard/route.ts`).
6. **Revenue and event insights** — charts, upcoming events, popular games (`app/admin/page.tsx`).
7. **Demo-data status** — seeded/empty state surfaced in UI while seed endpoint remains hidden (`app/admin/page.tsx`, `app/api/seed/route.ts`, `lib/db.ts`).

### Games
8. **Game library browse/filter** — search, category, condition, complexity, player count, replacement-only filters (`app/admin/games/page.tsx`, `app/admin/games/components/GameFilterBar.tsx`, `app/api/games/route.ts`).
9. **Game browsing modes** — grid and list presentations (`app/admin/games/components/GameGrid.tsx`, `app/admin/games/components/GameListTable.tsx`).
10. **Game CRUD** — add/edit modal with preview, copy counts, condition and replacement thresholds (`app/admin/games/components/GameModal.tsx`, `app/api/games/[id]/route.ts`).

### Tables, Sessions, and Billing
11. **Floor operations** — floor map, live list, session history, table management (`app/admin/tables/page.tsx`, `app/admin/tables/components/FloorMap.tsx`, `TableList.tsx`, `SessionHistoryTable.tsx`, `TableManagement.tsx`).
12. **Check-in and checkout** — seat party, estimate charge, close billing session (`app/admin/tables/components/CheckInModal.tsx`, `CheckoutModal.tsx`, `app/api/sessions/route.ts`, `app/api/sessions/[id]/route.ts`).
13. **Table editing** — capacity, section, shape, coordinates, maintenance mode (`app/admin/tables/components/TableEditorModal.tsx`, `app/api/tables/[id]/route.ts`).

### Checkout
14. **Game assignment flow** — active session select, searchable game combobox, checkout create (`app/admin/checkout/page.tsx`, `app/admin/checkout/components/CheckoutForm.tsx`, `app/api/checkout/route.ts`).
15. **Active and historical checkout records** — active table ledger, returned-history table, return modal (`CheckoutTable.tsx`, `CheckoutHistory.tsx`, `ReturnModal.tsx`, `app/api/checkout/[id]/return/route.ts`).

### Reservations
16. **Reservation filtering and views** — date/show-all/status/search controls with list/calendar toggle (`app/admin/reservations/page.tsx`).
17. **Reservation list & lifecycle actions** — confirm, no-show, edit, delete (`app/admin/reservations/components/ReservationList.tsx`, `app/api/reservations/[id]/route.ts`).
18. **Reservation calendar** — weekly strip and per-day cards (`app/admin/reservations/components/ReservationCalendar.tsx`).
19. **Reservation CRUD** — modal-backed create/edit flow (`app/admin/reservations/components/ReservationModal.tsx`, `app/api/reservations/route.ts`).

### Events & RSVPs
20. **Event catalog** — card grid, occupancy cues, edit/delete entry points (`app/admin/events/page.tsx`, `EventCard.tsx`).
21. **Event CRUD** — create/edit modal with timing, type, capacity, and status (`app/admin/events/components/EventModal.tsx`, `app/api/events/[id]/route.ts`).
22. **RSVP management** — load/add/remove attendees with client and server capacity checks (`app/admin/events/components/RsvpModal.tsx`, `app/api/events/[id]/rsvps/route.ts`, `app/api/events/[id]/rsvps/[rsvpId]/route.ts`).

## Phase 2 — Coverage Table

| # | Feature | Domain | Coverage | Notes |
| --- | --- | --- | --- | --- |
| 1 | Landing page demo positioning | Marketing | [PARTIAL] | `app/page.tsx` still frames the product like a live commercial SaaS with fabricated stats/pricing/testimonials instead of the current seeded demo. |
| 2 | Admin shell navigation | Shell | [COVERED] | Mobile drawer, sidebar, and shell framing are in place (`app/admin/layout.tsx`, `components/Sidebar.tsx`). |
| 3 | Dashboard KPI and alert visibility | Dashboard | [COVERED] | End-to-end via `app/admin/page.tsx` and `app/api/dashboard/route.ts`. |
| 4 | Demo seed readiness visibility | Dashboard | [PARTIAL] | Technically visible, but copy in `app/admin/page.tsx` still leaks endpoint details to operators. |
| 5 | Game filtering and browse modes | Games | [PARTIAL] | Filtering works, but `GameFilterBar.tsx` has no reset/active-filter recovery despite six controls. |
| 6 | Game CRUD and replacement review | Games | [COVERED] | `GameModal.tsx`, `GameGrid.tsx`, `GameListTable.tsx`, and `app/api/games/[id]/route.ts` are complete. |
| 7 | Floor map and live table list | Tables | [COVERED] | Map/list/history/manage flows are present in `app/admin/tables/page.tsx`. |
| 8 | New-party check-in | Tables | [PARTIAL] | `CheckInModal.tsx` estimates charges, but the client can drift into over-capacity states before the API rejects them. |
| 9 | Billing summary and session close | Tables | [COVERED] | `CheckoutModal.tsx` and `app/api/sessions/[id]/route.ts` close the loop cleanly. |
| 10 | Table management/editor | Tables | [PARTIAL] | CRUD exists, but some operator copy still exposes file paths and raw implementation detail (`TableManagement.tsx`, `FloorMap.tsx`). |
| 11 | Game checkout assignment | Checkout | [COVERED] | Search/select/assign flow is solid in `CheckoutForm.tsx` and `/api/checkout`. |
| 12 | Checkout history filtering | Checkout | [PARTIAL] | Filters work, but the helper copy in `app/admin/checkout/page.tsx` is written for developers, not staff. |
| 13 | Reservation toolbar and CRUD | Reservations | [COVERED] | Filters, list/calendar toggle, modal CRUD, and lifecycle actions are wired. |
| 14 | Reservation empty-state recovery | Reservations | [PARTIAL] | `ReservationList.tsx` and `ReservationCalendar.tsx` show generic no-data messages even when filters/search are the cause. |
| 15 | Event catalog and CRUD | Events | [COVERED] | Catalog cards and modal-backed editing are in place. |
| 16 | RSVP management | Events | [COVERED] | Client/server capacity checks and attendee management are present after prior passes. |
| 17 | Dev-only seed route | Operations | [HIDDEN] | `app/api/seed/route.ts` remains intentionally hidden from navigation in production. |
| 18 | Auto-seed bootstrap | Operations | [HIDDEN] | `lib/db.ts` initializes schema and sample data without a dedicated UI. |

## Phase 3 — Quality Findings & Severities

### 1. Demo credibility drift on the landing page `[MAJOR]`
**Criterion:** Trust / message accuracy  
**Problem:** `app/page.tsx` still presents fabricated adoption metrics, pricing tiers, and testimonials as if CaféMeeple were a live commercial product. That conflicts with the actual experience being offered today: a seeded admin demo backed by `lib/seed.ts`, `app/admin/**`, and `app/api/**`.  
**Concrete paths:** `app/page.tsx`, `lib/seed.ts`

### 2. Weak filter recovery in the game library `[MAJOR]`
**Criterion:** Discoverability / recovery  
**Problem:** `app/admin/games/components/GameFilterBar.tsx` exposes six independent controls, but neither it nor `app/admin/games/page.tsx` offers a reset-all action or active-filter summary. It is easy to land on an empty result set with no quick recovery path.  
**Concrete paths:** `app/admin/games/page.tsx`, `app/admin/games/components/GameFilterBar.tsx`

### 3. Reservation empty states do not explain filtered-out results `[MAJOR]`
**Criterion:** Feedback / recovery  
**Problem:** When search, status, or date filters remove all results, `ReservationList.tsx` still says “No reservations,” and `ReservationCalendar.tsx` still says “No reservations for this date.” The UI does not acknowledge active filters or offer a local reset path from the zero-state itself.  
**Concrete paths:** `app/admin/reservations/page.tsx`, `app/admin/reservations/components/ReservationList.tsx`, `app/admin/reservations/components/ReservationCalendar.tsx`

### 4. Check-in flow relies on server rejection for table-capacity mismatches `[MAJOR]`
**Criterion:** Error prevention / data entry safety  
**Problem:** `CheckInModal.tsx` does not clamp guest count when staff switch to a smaller table and does not clearly explain the table-capacity limit inline. The API in `app/api/sessions/route.ts` eventually blocks oversized parties, but the modal lets operators reach a bad state first.  
**Concrete paths:** `app/admin/tables/components/CheckInModal.tsx`, `app/api/sessions/route.ts`

### 5. Developer-centric copy leaks into operator-facing admin screens `[MODERATE]`
**Criterion:** Clarity / professionalism  
**Problem:** Several admin views expose internal implementation details instead of staff-oriented language: the dashboard mentions `POST /api/seed`, checkout references `session_id` / `game_id` and `app/api/checkout/route.ts`, and tables screens reference `app/api/tables/[id]/route.ts` and raw floor-layout internals. This makes polished operational UI feel like a developer console.  
**Concrete paths:** `app/admin/page.tsx`, `app/admin/checkout/page.tsx`, `app/admin/tables/page.tsx`, `app/admin/tables/components/FloorMap.tsx`, `app/admin/tables/components/TableManagement.tsx`

## Phase 4 — Remediations with Effort

| # | Remediation | Effort | Target paths |
| --- | --- | --- | --- |
| 1 | Reframe the landing page as a truthful seeded demo walkthrough: replace fabricated stats/pricing/testimonials with real demo highlights and current admin-route CTAs. | [S] | `app/page.tsx`, `lib/seed.ts` |
| 2 | Add reset-all recovery to the games toolbar and show how many filters are active so staff can quickly recover from empty result sets. | [XS] | `app/admin/games/page.tsx`, `app/admin/games/components/GameFilterBar.tsx` |
| 3 | Make reservation zero-states filter-aware, with contextual messaging and an inline reset path in both list and calendar views. | [S] | `app/admin/reservations/page.tsx`, `ReservationList.tsx`, `ReservationCalendar.tsx` |
| 4 | Clamp guest count to the selected table capacity, explain the limit inline, and prevent invalid check-in submissions before they hit the API. | [S] | `app/admin/tables/components/CheckInModal.tsx`, `app/api/sessions/route.ts` |
| 5 | Replace developer-facing helper copy with operator-language guidance on dashboard, checkout, and tables screens. | [XS] | `app/admin/page.tsx`, `app/admin/checkout/page.tsx`, `app/admin/tables/page.tsx`, `FloorMap.tsx`, `TableManagement.tsx` |

## Phase 5 — Stack Rank + Quick Wins

### Quick Wins

| Rank | Remediation | Why now |
| --- | --- | --- |
| 1 | Games filter reset + active filter count | High clarity gain with tiny surface area; immediately improves a core browse workflow. |
| 2 | Operator-copy cleanup | Fast polish pass across multiple screens that removes avoidable jargon and trust drag. |
| 3 | Reservation zero-state reset affordance | Low engineering risk, strong recovery improvement when filters hide data. |

### Full Stack Rank

| Rank | Item | Severity | Effort | Rationale |
| --- | --- | --- | --- | --- |
| 1 | Check-in capacity guardrails | [MAJOR] | [S] | Prevents avoidable operator errors in a live floor workflow before the server has to reject the action. |
| 2 | Game filter recovery | [MAJOR] | [XS] | The game library is a daily-use surface, and six filters without reset is easy to misconfigure. |
| 3 | Reservation filter-aware empty states | [MAJOR] | [S] | Makes “no data” states explainable and reversible from the exact screen where confusion happens. |
| 4 | Landing page demo credibility | [MAJOR] | [S] | First impression still over-promises versus the product currently available in `/admin`. |
| 5 | Admin copy cleanup | [MODERATE] | [XS] | Removes internal jargon that makes operator UI feel unfinished. |

## Implementation Status

**Status:** In progress (3 of 5 remediations complete).

- [ ] Reframe `app/page.tsx` around the current seeded demo rather than unsupported commercial claims.
- [x] Add reset-all recovery and active-filter feedback to the games toolbar.
- [x] Make reservation empty states context-aware and resettable.
- [x] Guard check-in party size against selected-table capacity in the modal.
- [ ] Remove developer-facing implementation jargon from operator-visible admin copy.

### Baseline validation completed before edits

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
