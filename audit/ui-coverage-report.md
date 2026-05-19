# CaféMeeple UI Coverage Report

## Summary
- **Stack audited:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, SQLite via `better-sqlite3` (`package.json`, `lib/db.ts`).
- **Router inventory:** UI routes live under `app/page.tsx`, `app/admin/page.tsx`, `app/admin/games/page.tsx`, `app/admin/tables/page.tsx`, `app/admin/checkout/page.tsx`, `app/admin/reservations/page.tsx`, and `app/admin/events/page.tsx`. API routes live under `app/api/**/route.ts`.
- **UI entry points:** public landing page in `app/page.tsx`; authenticated/admin shell in `app/admin/layout.tsx` with shared navigation in `components/Sidebar.tsx` and shared feedback primitives in `components/Toast.tsx`, `components/Modal.tsx`, `components/ConfirmDialog.tsx`, and `components/ui.tsx`.
- **Config / capability files:** `next.config.ts`, `.env.example`, `lib/constants.ts`; no runtime feature-flag framework or capability manifest was found in source.
- **Audit verdict:** CaféMeeple already covers the core café workflow end to end (dashboard, library, floor operations, checkout, reservations, events), but several backend-backed capabilities are still hidden or only partially surfaced: true floor-plan geometry, table CRUD, session history, dashboard alert actions, image metadata editing, seed-state visibility, and API-backed filtering controls.

## Phase 1 — Feature Inventory

### Marketing & Navigation
1. **Marketing landing page** — Presents hero messaging, feature marketing, pricing, testimonials, and dashboard CTA on `/` (`app/page.tsx`).
2. **Responsive admin shell** — Provides persistent admin navigation, mobile menu, error boundary, and toast notifications across `/admin/*` (`app/admin/layout.tsx`, `components/Sidebar.tsx`, `components/Toast.tsx`).

### Analytics & Operations
3. **Daily KPI dashboard** — Shows active tables, games checked out, revenue, and visitors for the current day (`app/admin/page.tsx`, `app/api/dashboard/route.ts`).
4. **Revenue analytics** — Breaks 30-day revenue into cover charges, food & beverage, retail, and events with chart views (`app/admin/page.tsx`, `app/api/dashboard/route.ts`).
5. **Upcoming event capacity watchlist** — Shows near-term events with RSVP fill percentages (`app/admin/page.tsx`, `app/api/dashboard/route.ts`).
6. **Operational alerts feed** — Surfaces replacement-risk titles, low inventory, and same-day reservation pressure (`app/admin/page.tsx`, `app/api/dashboard/route.ts`).

### Game Library
7. **Library browsing** — Shows the full game catalog in grid and table views with inventory and condition metadata (`app/admin/games/page.tsx`, `app/admin/games/components/GameGrid.tsx`, `app/admin/games/components/GameListTable.tsx`).
8. **Library search and filters** — Filters games by search text, category, condition, complexity, player count, and replacement status (`app/admin/games/page.tsx`, `app/admin/games/components/GameFilterBar.tsx`, `app/api/games/route.ts`).
9. **Game CRUD** — Creates, edits, and deletes game records with server-side validation and delete protections for titles with checkout history (`app/admin/games/components/GameModal.tsx`, `app/api/games/route.ts`, `app/api/games/[id]/route.ts`).
10. **Condition and replacement tracking** — Computes replacement risk from condition score and checkout thresholds and exposes inspection metadata (`lib/db.ts`, `app/api/games/route.ts`, `app/admin/games/page.tsx`).
11. **Game cover-image metadata** — Stores and returns `image_url` for catalog cards and seeded titles (`lib/db.ts`, `lib/seed.ts`, `app/api/games/route.ts`).

### Tables & Sessions
12. **Live floor overview** — Shows table availability and active session state from `/api/tables` and `/api/sessions?status=active` (`app/admin/tables/page.tsx`, `app/admin/tables/components/FloorMap.tsx`, `app/admin/tables/components/TableList.tsx`).
13. **Session check-in flow** — Starts a table session with party name, guest count, rate model, and estimated cover charge (`app/admin/tables/components/CheckInModal.tsx`, `app/api/sessions/route.ts`).
14. **Session closeout and billing** — Closes an active session, computes final charge, frees the table, and auto-returns outstanding games (`app/admin/tables/components/CheckoutModal.tsx`, `app/api/sessions/[id]/route.ts`).
15. **Table roster CRUD** — Creates, updates, and deletes tables including section, shape, coordinates, and maintenance status (`app/api/tables/route.ts`, `app/api/tables/[id]/route.ts`).
16. **Session history retrieval** — Lists recent sessions, including completed ones, with totals and active-game counts (`app/api/sessions/route.ts`).
17. **Reservation-aware table occupancy** — Automatically derives `available`, `occupied`, `reserved`, and `maintenance` table states from sessions and reservations (`app/api/tables/route.ts`, `lib/types.ts`).

### Game Checkout
18. **Game assignment to active sessions** — Checks out available games to active tables (`app/admin/checkout/page.tsx`, `app/admin/checkout/components/CheckoutForm.tsx`, `app/api/checkout/route.ts`).
19. **Game returns with condition logging** — Returns checked-out games, records return notes, and updates condition and replacement flags (`app/admin/checkout/components/ReturnModal.tsx`, `app/api/checkout/[id]/return/route.ts`).
20. **Checkout ledgers** — Shows active checkout rows and return history (`app/admin/checkout/components/CheckoutTable.tsx`, `app/admin/checkout/components/CheckoutHistory.tsx`, `app/api/checkout/route.ts`).
21. **Checkout record filtering** — Supports filtering checkout records by `session_id` and `game_id` at the API level (`app/api/checkout/route.ts`).

### Reservations
22. **Reservation views** — Presents reservations in list and weekly calendar layouts (`app/admin/reservations/page.tsx`, `app/admin/reservations/components/ReservationList.tsx`, `app/admin/reservations/components/ReservationCalendar.tsx`).
23. **Reservation CRUD** — Creates, edits, and cancels reservations with guest details, duration, notes, and optional table assignment (`app/admin/reservations/components/ReservationModal.tsx`, `app/api/reservations/route.ts`, `app/api/reservations/[id]/route.ts`).
24. **Reservation status workflow** — Confirms, marks no-shows, enforces overlap rules, and enforces table capacity on reservation save/update (`app/admin/reservations/page.tsx`, `app/admin/reservations/components/ReservationList.tsx`, `app/api/reservations/route.ts`, `app/api/reservations/[id]/route.ts`).
25. **Reservation endpoint filtering** — Supports server-side filtering by `date`, `status`, and `limit` (`app/api/reservations/route.ts`).

### Events
26. **Event CRUD** — Creates, edits, and deletes events with date, time, type, capacity, and status (`app/admin/events/page.tsx`, `app/admin/events/components/EventModal.tsx`, `app/api/events/route.ts`, `app/api/events/[id]/route.ts`).
27. **Event cards with occupancy** — Shows event status, schedule, event type, and RSVP fill percentage (`app/admin/events/components/EventCard.tsx`, `app/admin/events/page.tsx`).
28. **RSVP management** — Lists, adds, and removes RSVP records while enforcing event capacity (`app/admin/events/components/RsvpModal.tsx`, `app/api/events/[id]/rsvps/route.ts`, `app/api/events/[id]/rsvps/[rsvpId]/route.ts`).

### Demo Data & Maintenance
29. **Development auto-seeding and seed visibility** — Automatically seeds the SQLite database on first load in non-production and exposes a read-only seed-status endpoint (`lib/db.ts`, `app/api/seed/route.ts`).
30. **Development-only seed trigger** — Exposes a guarded POST endpoint for manual seeding in non-production (`app/api/seed/route.ts`).

## Phase 2 — UI Coverage Mapping

| # | Feature | Domain | UI Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Marketing landing page | Marketing & Navigation | [COVERED] | Fully represented in `app/page.tsx`. |
| 2 | Responsive admin shell | Marketing & Navigation | [COVERED] | Navigation, mobile shell, toasts, and error boundary are present in `app/admin/layout.tsx`. |
| 3 | Daily KPI dashboard | Analytics & Operations | [COVERED] | KPI cards are surfaced on `/admin` from `app/api/dashboard/route.ts`. |
| 4 | Revenue analytics | Analytics & Operations | [COVERED] | Bar + pie charts are rendered in `app/admin/page.tsx`. |
| 5 | Upcoming event capacity watchlist | Analytics & Operations | [COVERED] | Upcoming event cards are visible on `/admin`. |
| 6 | Operational alerts feed | Analytics & Operations | [PARTIAL] | Alerts render as passive text banners in `app/admin/page.tsx` with no direct action path. |
| 7 | Library browsing | Game Library | [COVERED] | Grid/table browsing is available on `/admin/games`. |
| 8 | Library search and filters | Game Library | [COVERED] | Search and filter controls are exposed in `GameFilterBar.tsx`. |
| 9 | Game CRUD | Game Library | [PARTIAL] | Core create/edit/delete exists, but not all persisted fields are editable from `GameModal.tsx`. |
| 10 | Condition and replacement tracking | Game Library | [COVERED] | Replacement count and condition status are visible in game cards/tables. |
| 11 | Game cover-image metadata | Game Library | [MISSING] | `image_url` is returned by the API and used by cards, but there is no form control in `GameModal.tsx`. |
| 12 | Live floor overview | Tables & Sessions | [PARTIAL] | `FloorMap.tsx` is a card grid; it does not use stored coordinates or shapes from the table model. |
| 13 | Session check-in flow | Tables & Sessions | [PARTIAL] | Check-in exists, but clicking an available table does not preselect the tapped table and reserved/maintenance states are dead ends. |
| 14 | Session closeout and billing | Tables & Sessions | [COVERED] | Billing summary and close-session flow are exposed in `CheckoutModal.tsx`. |
| 15 | Table roster CRUD | Tables & Sessions | [MISSING] | CRUD endpoints exist under `app/api/tables*.ts`, but `/admin/tables` has no table-management UI. |
| 16 | Session history retrieval | Tables & Sessions | [HIDDEN] | `/api/sessions` returns recent completed sessions, but `/admin/tables` only shows active sessions. |
| 17 | Reservation-aware table occupancy | Tables & Sessions | [COVERED] | Derived statuses are visible through `/api/tables` responses and current table views. |
| 18 | Game assignment to active sessions | Game Checkout | [COVERED] | Available in `CheckoutForm.tsx`. |
| 19 | Game returns with condition logging | Game Checkout | [COVERED] | Available in `ReturnModal.tsx`. |
| 20 | Checkout ledgers | Game Checkout | [COVERED] | Active and history tables are visible on `/admin/checkout`. |
| 21 | Checkout record filtering | Game Checkout | [HIDDEN] | API filters exist in `app/api/checkout/route.ts`, but no UI control exposes them. |
| 22 | Reservation views | Reservations | [COVERED] | Weekly calendar and list modes exist on `/admin/reservations`. |
| 23 | Reservation CRUD | Reservations | [COVERED] | Reservation modal and delete flow are implemented. |
| 24 | Reservation status workflow | Reservations | [COVERED] | Confirm/no-show/cancel actions and server validation are in place. |
| 25 | Reservation endpoint filtering | Reservations | [PARTIAL] | The API supports status/date filtering, but the UI only exposes date/show-all controls. |
| 26 | Event CRUD | Events | [COVERED] | Event creation, editing, and deletion are fully exposed. |
| 27 | Event cards with occupancy | Events | [COVERED] | Event fill states are visible in `EventCard.tsx`. |
| 28 | RSVP management | Events | [COVERED] | RSVP list/add/remove flow is present in `RsvpModal.tsx`. |
| 29 | Development auto-seeding and seed visibility | Demo Data & Maintenance | [HIDDEN] | Auto-seeding happens in `lib/db.ts`, and `/api/seed` exists, but there is no admin visibility into dataset state. |
| 30 | Development-only seed trigger | Demo Data & Maintenance | [HIDDEN] | POST `/api/seed` exists but is intentionally not exposed in the admin UI. |

## Phase 3 — UX Quality Assessment

_Only material issues are listed below. Covered features not called out here did not show high-signal UX problems in the current source audit._

**#6 — Operational alerts feed** `[MAJOR]`
- **Criterion violated:** Discoverability / Feedback
- **Specific problem:** Alerts are rendered as plain status text with no link, CTA, or drill-down path, so staff must guess which page to open next when inventory, replacement, or reservation pressure warnings appear.
- **Location in codebase:** `app/admin/page.tsx`, `app/api/dashboard/route.ts`

**#9 / #11 — Game CRUD and cover-image metadata** `[MAJOR]`
- **Criterion violated:** Consistency / Edge cases
- **Specific problem:** Game cards already render `image_url`, and seeded data includes cover art, but the create/edit modal cannot create or maintain that field. This creates a data-model/UI mismatch and makes media-backed catalog curation unreachable from the admin.
- **Location in codebase:** `app/admin/games/components/GameModal.tsx`, `app/admin/games/components/GameGrid.tsx`, `app/api/games/route.ts`, `lib/seed.ts`

**#12 — Live floor overview** `[MAJOR]`
- **Criterion violated:** Discoverability / Consistency
- **Specific problem:** The feature is labeled “Floor map,” but the UI is a uniform card grid that ignores `x_position`, `y_position`, and `shape`. Staff cannot learn or adjust the actual room layout even though the backend stores that geometry.
- **Location in codebase:** `app/admin/tables/components/FloorMap.tsx`, `app/api/tables/route.ts`, `app/api/tables/[id]/route.ts`, `lib/types.ts`

**#13 — Session check-in flow** `[MAJOR]`
- **Criterion violated:** Feedback / Edge cases
- **Specific problem:** Clicking an available table opens a generic check-in flow without preserving the user’s table choice, and reserved/maintenance tables do nothing on click. The result is extra work for available tables and dead-end interaction for blocked tables.
- **Location in codebase:** `app/admin/tables/components/FloorMap.tsx`, `app/admin/tables/components/CheckInModal.tsx`

**#21 — Checkout record filtering** `[MAJOR]`
- **Criterion violated:** Discoverability
- **Specific problem:** Checkout history and active ledgers cannot be narrowed by session or game from the UI, even though the API supports both filters. Operators must scan long tables manually.
- **Location in codebase:** `app/admin/checkout/page.tsx`, `app/api/checkout/route.ts`

**#25 — Reservation endpoint filtering** `[MAJOR]`
- **Criterion violated:** Discoverability / Edge cases
- **Specific problem:** Reservations can be filtered by date only. High-volume workflows have no search or status controls despite the backend already supporting status filtering.
- **Location in codebase:** `app/admin/reservations/page.tsx`, `app/admin/reservations/components/ReservationList.tsx`, `app/api/reservations/route.ts`

## Phase 4 — Remediation Plan

**Remediation #1** `[S]`
- **Feature:** #6 Operational alerts feed
- **What to fix:** Turn dashboard alerts into actionable cards with explicit destination links and clearer context labels.
- **Where:** `app/admin/page.tsx`
- **Recommended pattern:** Alert card with severity styling, short explanation, and CTA link/button to the relevant page (`/admin/games`, `/admin/reservations`, etc.).

**Remediation #2** `[XS]`
- **Feature:** #29 Development auto-seeding and seed visibility
- **What to fix:** Surface read-only seed status in the admin so operators can tell whether demo data is loaded, while keeping the POST seed trigger internal-only.
- **Where:** `app/admin/page.tsx`, `app/api/seed/route.ts`
- **Recommended pattern:** Small dashboard utility card showing seeded/not seeded state and current record counts.

**Remediation #3** `[S]`
- **Feature:** #11 Game cover-image metadata
- **What to fix:** Add an editable `image_url` control and preview to the game modal so library media can be created and maintained from the UI.
- **Where:** `app/admin/games/components/GameModal.tsx`
- **Recommended pattern:** Labeled URL field with helper text and live preview/fallback thumbnail.

**Remediation #4** `[L]`
- **Feature:** #12 Live floor overview and #15 Table roster CRUD
- **What to fix:** Replace the faux “floor map” grid with a coordinate-based canvas, expose table section/shape/coordinate/maintenance editing, and align table validation with the stored layout coordinate system.
- **Where:** `app/admin/tables/page.tsx`, `app/admin/tables/components/FloorMap.tsx`, new table-management components under `app/admin/tables/components/`, `app/api/tables/route.ts`, `app/api/tables/[id]/route.ts`, `lib/types.ts`
- **Recommended pattern:** Map canvas + management tab/table + create/edit modal with validated layout fields.

**Remediation #5** `[S]`
- **Feature:** #13 Session check-in flow
- **What to fix:** Preserve the tapped table when launching check-in and give reserved/maintenance tables a non-dead-end detail state.
- **Where:** `app/admin/tables/components/FloorMap.tsx`, `app/admin/tables/components/CheckInModal.tsx`
- **Recommended pattern:** Context-aware modal defaults plus detail panel or inline explainer for blocked tables.

**Remediation #6** `[M]`
- **Feature:** #16 Session history retrieval
- **What to fix:** Expose recent session history with timestamps, totals, and status inside the Tables area.
- **Where:** `app/admin/tables/page.tsx`, new history component under `app/admin/tables/components/`, `app/api/sessions/route.ts`
- **Recommended pattern:** Session-history tab with status chips and compact metrics table.

**Remediation #7** `[S]`
- **Feature:** #21 Checkout record filtering
- **What to fix:** Add session/game filters and stronger empty-state guidance to the checkout page.
- **Where:** `app/admin/checkout/page.tsx`, `app/admin/checkout/components/CheckoutForm.tsx`, `app/admin/checkout/components/CheckoutTable.tsx`, `app/admin/checkout/components/CheckoutHistory.tsx`
- **Recommended pattern:** Secondary filter bar above ledger tabs with clear reset path and contextual empty states.

**Remediation #8** `[S]`
- **Feature:** #25 Reservation endpoint filtering
- **What to fix:** Add search and status filtering so staff can narrow long reservation lists without changing dates.
- **Where:** `app/admin/reservations/page.tsx`, `app/admin/reservations/components/ReservationList.tsx`, `app/api/reservations/route.ts`
- **Recommended pattern:** Reservation filter bar with guest search, status select, and result count.

## Phase 5 — Priority Stack Rank

### Quick Wins

| Priority | Remediation # | Feature | Severity | Effort |
| --- | --- | --- | --- | --- |
| 1 | 1 | Dashboard alert actions | MAJOR | S |
| 2 | 3 | Game cover-image editing | MAJOR | S |
| 3 | 5 | Context-aware session check-in | MAJOR | S |
| 4 | 7 | Checkout filters and guidance | MAJOR | S |
| 5 | 8 | Reservation search and status filters | MAJOR | S |

### Full Stack Rank

| Priority | Remediation # | Feature | Severity | Effort |
| --- | --- | --- | --- | --- |
| 1 | 4 | Real floor plan + table management | CRITICAL | L |
| 2 | 6 | Session history visibility | MAJOR | M |
| 3 | 1 | Dashboard alert actions | MAJOR | S |
| 4 | 3 | Game cover-image editing | MAJOR | S |
| 5 | 5 | Context-aware session check-in | MAJOR | S |
| 6 | 7 | Checkout filters and guidance | MAJOR | S |
| 7 | 8 | Reservation search and status filters | MAJOR | S |
| 8 | 2 | Demo-data seed status visibility | MINOR | XS |
