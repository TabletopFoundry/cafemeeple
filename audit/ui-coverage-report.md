# UX Coverage Audit — CaféMeeple

Fresh pass over the current Next.js 16 App Router codebase. I scanned the live UI entry points (`app/page.tsx`, `app/admin/*`), supporting route handlers under `app/api/**`, shared shell/components, `package.json`, `next.config.ts`, `.env.example`, and `lib/db.ts`. There is no runtime feature-flag framework in source; the only capability gates are dev-only seeding (`app/api/seed/route.ts`, `lib/db.ts`) and the optional `NEXT_PUBLIC_BASE_URL` setting in `.env.example`.

Overall, the operational surface is strong: the product exposes end-to-end flows for games, tables, sessions, checkout, reservations, events, analytics, and seeded demo data. This pass found **5 new actionable UX issues**: marketing copy drift on the landing page, incomplete reservation filter reset behavior, checkout feedback/safe-return gaps, RSVP modal stale/loading capacity feedback, and mobile drawer accessibility. All 5 were implemented in this pass; see **Implementation Status** at the end.

## Phase 1 — Feature Inventory

### Marketing & Shell
1. **Landing / marketing site** — hero, feature cards, pricing, testimonials, and admin CTAs (`app/page.tsx`).
2. **Admin shell** — desktop sidebar, mobile drawer, page framing, global toast system, error boundary (`app/admin/layout.tsx`, `components/Sidebar.tsx`, `components/Toast.tsx`, `components/ErrorBoundary.tsx`).
3. **Shared modal/dialog primitives** — focus-managed modal and confirm dialog used across admin workflows (`components/Modal.tsx`, `components/ConfirmDialog.tsx`).

### Dashboard & Operational Insights
4. **Today KPIs** — active tables, games checked out, revenue, visitors (`app/admin/page.tsx`, `app/api/dashboard/route.ts`).
5. **Operational alerts** — replacement, low-stock, reservation pressure alerts with deep links (`app/admin/page.tsx`, `app/api/dashboard/route.ts`).
6. **Revenue visualization** — 30-day revenue mix charts and summaries (`app/admin/page.tsx`).
7. **Upcoming events panel** — near-term event load and seat pressure (`app/admin/page.tsx`, `app/api/dashboard/route.ts`).
8. **Popular games snapshots** — top games for 7-day and 30-day windows (`app/admin/page.tsx`, `app/api/dashboard/route.ts`).
9. **Seed status visibility** — seeded/empty status surfaced in admin while `POST /api/seed` stays hidden from nav (`app/admin/page.tsx`, `app/api/seed/route.ts`).

### Game Library
10. **Library filtering** — search, category, condition, complexity, player-count, replacement-only filters (`app/admin/games/page.tsx`, `app/admin/games/components/GameFilterBar.tsx`, `app/api/games/route.ts`).
11. **Grid/list browsing** — visual card grid and tabular list views for the same catalog (`GameGrid.tsx`, `GameListTable.tsx`).
12. **Game CRUD** — add/edit modal with image preview, condition, thresholds, and shelf metadata (`GameModal.tsx`, `app/api/games/route.ts`, `app/api/games/[id]/route.ts`).
13. **Replacement review cues** — replacement badges, warning counts, delete guardrails for used titles (`app/admin/games/page.tsx`, `GameGrid.tsx`, `GameListTable.tsx`, `app/api/games/[id]/route.ts`).

### Tables, Floor, and Sessions
14. **Floor map** — coordinate/shape-driven table layout with selected-table detail panel (`app/admin/tables/page.tsx`, `app/admin/tables/components/FloorMap.tsx`, `app/api/tables/route.ts`).
15. **Active table list** — occupancy, elapsed time, billing, game count, and per-row actions (`TableList.tsx`).
16. **Check-in flow** — seat a new party, choose rate model, estimate charge (`CheckInModal.tsx`, `app/api/sessions/route.ts`).
17. **Billing / session close** — billing summary modal and close-session flow (`CheckoutModal.tsx`, `app/api/sessions/[id]/route.ts`).
18. **Session history** — filtered history of active/completed sessions (`SessionHistoryTable.tsx`).
19. **Table management** — roster view, add/edit modal, coordinate and maintenance management, delete protections (`TableManagement.tsx`, `TableEditorModal.tsx`, `app/api/tables/[id]/route.ts`).

### Game Checkout
20. **Checkout assignment** — active-session selector + searchable game combobox (`app/admin/checkout/page.tsx`, `CheckoutForm.tsx`, `app/api/checkout/route.ts`).
21. **Active checkout ledger** — open checkouts with one-click return action (`CheckoutTable.tsx`).
22. **Return workflow** — return modal with condition + notes, inventory/condition update route (`ReturnModal.tsx`, `app/api/checkout/[id]/return/route.ts`).
23. **Checkout history filters** — session/game filters and returned-history tab (`app/admin/checkout/page.tsx`, `CheckoutHistory.tsx`).

### Reservations
24. **Reservation filtering** — date filter, show-all toggle, status filter, guest search, list/calendar toggle (`app/admin/reservations/page.tsx`).
25. **Calendar view** — weekly strip with per-day counts and reservation cards (`ReservationCalendar.tsx`).
26. **List view** — guest/table/status table with confirm/no-show/edit/delete actions (`ReservationList.tsx`).
27. **Reservation CRUD** — create/edit modal with party size, duration, optional table, notes (`ReservationModal.tsx`, `app/api/reservations/route.ts`, `app/api/reservations/[id]/route.ts`).

### Events & RSVPs
28. **Event catalog** — cards with status, schedule, occupancy meter, RSVP/edit/delete actions (`app/admin/events/page.tsx`, `EventCard.tsx`).
29. **Event CRUD** — create/edit modal with timing, capacity, type, status (`EventModal.tsx`, `app/api/events/route.ts`, `app/api/events/[id]/route.ts`).
30. **RSVP management** — add/remove attendee records inside modal (`RsvpModal.tsx`, `app/api/events/[id]/rsvps/route.ts`, `app/api/events/[id]/rsvps/[rsvpId]/route.ts`).

### Hidden / Operational Capabilities
31. **Dev-only manual seeding endpoint** — hidden from navigation, guarded in production (`app/api/seed/route.ts`).
32. **Automatic schema bootstrap + seed** — DB singleton, schema initialization, dev auto-seeding (`lib/db.ts`).

## Phase 2 — UI Coverage

| # | Feature | Domain | UI Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Landing page product positioning and demo CTAs | Marketing | [PARTIAL] | Marketing surface existed in `app/page.tsx`, but several labels/descriptions overstated current capabilities or implied a trial flow rather than the seeded admin demo. |
| 2 | Admin shell and navigation | Platform shell | [PARTIAL] | Desktop nav was solid, but the mobile drawer in `app/admin/layout.tsx` lacked an explicit close affordance and keyboard dismissal behavior. |
| 3 | Dashboard KPIs, alerts, charts, upcoming events | Dashboard | [COVERED] | End-to-end via `app/admin/page.tsx`, `app/api/dashboard/route.ts`, `app/api/seed/route.ts`. |
| 4 | Game library filtering | Games | [COVERED] | Search + multi-filter workflow is implemented across `GamesPage`, `GameFilterBar.tsx`, and `/api/games`. |
| 5 | Grid/list catalog browsing | Games | [COVERED] | Both `GameGrid.tsx` and `GameListTable.tsx` are wired and switchable. |
| 6 | Game create/edit flow | Games | [COVERED] | `GameModal.tsx` + `app/api/games/**` support add/edit with validations and preview. |
| 7 | Replacement review/delete guardrails | Games | [COVERED] | Replacement cues and deletion guardrails are visible in UI/API (`GameGrid.tsx`, `GameListTable.tsx`, `app/api/games/[id]/route.ts`). |
| 8 | Floor map operations | Tables & sessions | [COVERED] | `FloorMap.tsx` exposes selection, state, and next actions tied to `/api/tables` + `/api/sessions`. |
| 9 | Active table list and billing summary | Tables & sessions | [COVERED] | `TableList.tsx` and `CheckoutModal.tsx` cover the row-based operational view. |
| 10 | New-party check-in | Tables & sessions | [COVERED] | `CheckInModal.tsx` + `/api/sessions` handle table assignment and charge preview. |
| 11 | Session history | Tables & sessions | [COVERED] | `SessionHistoryTable.tsx` exposes active/completed history with filters. |
| 12 | Table management/editor | Tables & sessions | [COVERED] | `TableManagement.tsx` and `TableEditorModal.tsx` expose CRUD and layout maintenance. |
| 13 | Game checkout assignment | Checkout | [PARTIAL] | Core workflow existed, but `CheckoutForm.tsx` gave weak confirmation when a game was selected and a weak no-results state. |
| 14 | Game return flow | Checkout | [PARTIAL] | `ReturnModal.tsx` and `app/api/checkout/[id]/return/route.ts` allowed returns, but the default return condition risked accidental record changes. |
| 15 | Checkout history ledger filters | Checkout | [COVERED] | Session/game filters and history tab are present in `app/admin/checkout/page.tsx`. |
| 16 | Reservation filters and list/calendar views | Reservations | [PARTIAL] | `app/admin/reservations/page.tsx` covered the filters, but reset behavior only partially cleared the active filter state. |
| 17 | Reservation create/edit flow | Reservations | [COVERED] | `ReservationModal.tsx` + `/api/reservations` cover authoring and editing. |
| 18 | Reservation lifecycle actions | Reservations | [COVERED] | Confirm/no-show/delete actions are exposed from `ReservationList.tsx` and `/api/reservations/[id]/route.ts`. |
| 19 | Event catalog and occupancy cues | Events | [COVERED] | `EventsPage` + `EventCard.tsx` provide browse/edit/delete entry points. |
| 20 | Event create/edit flow | Events | [COVERED] | `EventModal.tsx` + `/api/events/**` cover authoring and editing. |
| 21 | RSVP management modal | Events | [PARTIAL] | `RsvpModal.tsx` allowed add/remove, but opened before fresh RSVP data loaded and gave no pre-submit capacity feedback. |
| 22 | Manual seed endpoint/status | Operations | [HIDDEN] | `app/api/seed/route.ts` is intentionally hidden from nav and only surfaced through dashboard status copy. |
| 23 | Auto-seed/bootstrap | Operations | [HIDDEN] | `lib/db.ts` auto-initializes schema and seed data without a dedicated admin UI. |

## Phase 3 — UX Quality

**#1 — Landing page product messaging** `[MINOR]`  
**Criterion:** Consistency / trust  
**Problem:** The landing page in `app/page.tsx` mixed real demo features with overstated claims (for example: waitlist/BGG-style wording and trial-oriented CTA labels), which made the public-facing promise drift away from the actual seeded admin experience exposed at `/admin`.  
**Location:** `app/page.tsx`

**#2 — Reservation filter reset** `[MAJOR]`  
**Criterion:** Discoverability / edge cases  
**Problem:** The “Reset filters” action in `app/admin/reservations/page.tsx` only cleared `search` and `statusFilter`. If a user still had `selectedDate` or `showAll` active, the page could continue hiding results after “reset,” making the UI feel unreliable.  
**Location:** `app/admin/reservations/page.tsx`

**#3 — Checkout selection + return safety** `[MAJOR]`  
**Criterion:** Feedback / data-entry safety  
**Problem:** `app/admin/checkout/components/CheckoutForm.tsx` did not clearly confirm which game had been selected, and `app/admin/checkout/components/ReturnModal.tsx` defaulted returns to “Good.” Combined with `app/api/checkout/[id]/return/route.ts`, that made it too easy to submit a return without deliberately choosing the observed condition.  
**Location:** `app/admin/checkout/components/CheckoutForm.tsx`, `app/admin/checkout/components/ReturnModal.tsx`, `app/api/checkout/[id]/return/route.ts`

**#4 — RSVP modal freshness and capacity feedback** `[MAJOR]`  
**Criterion:** Feedback / edge cases  
**Problem:** The RSVP modal could open on stale/empty data while a fresh fetch was still in flight, and the add-RSVP flow in `app/admin/events/components/RsvpModal.tsx` gave no remaining-seat guidance before submit. Staff had to infer whether the modal was still loading or wait for the server to reject an over-capacity request.  
**Location:** `app/admin/events/page.tsx`, `app/admin/events/components/RsvpModal.tsx`

**#5 — Mobile admin drawer accessibility** `[MAJOR]`  
**Criterion:** Accessibility / discoverability  
**Problem:** On narrow viewports, `app/admin/layout.tsx` opened a slide-in drawer with no dedicated close button, no Escape-key handling, and no scroll lock. That made the navigation harder to dismiss for keyboard users and increased the chance of focus/scroll confusion.  
**Location:** `app/admin/layout.tsx`

## Phase 4 — Remediation Plan

**Remediation #1** `[XS]`  
**Description:** Align the public landing copy with the actual seeded admin demo by updating feature language and CTA labels so they describe the current product surface instead of aspirational flows.  
**Target:** `app/page.tsx`  
**UI pattern:** Truthful product messaging + route-label alignment

**Remediation #2** `[XS]`  
**Description:** Replace the partial reservation reset action with a single reset-all control that restores the default date, clears the show-all toggle, and removes search/status filters together.  
**Target:** `app/admin/reservations/page.tsx`  
**UI pattern:** Reversible filter toolbar / reset-all affordance

**Remediation #3** `[S]`  
**Description:** Add a selected-game confirmation state in the checkout combobox, strengthen the empty-search feedback, and require an explicit return condition selection before a return can be submitted. Enforce the same requirement in the return route.  
**Target:** `app/admin/checkout/components/CheckoutForm.tsx`, `app/admin/checkout/components/ReturnModal.tsx`, `app/api/checkout/[id]/return/route.ts`  
**UI pattern:** Selection confirmation + guarded destructive/quality update

**Remediation #4** `[S]`  
**Description:** Clear stale RSVP data on modal open, show an explicit loading state while fresh attendee data is loading, surface remaining-seat guidance, and block oversize RSVP submissions before they hit the server.  
**Target:** `app/admin/events/page.tsx`, `app/admin/events/components/RsvpModal.tsx`  
**UI pattern:** Loading-state feedback + inline capacity validation

**Remediation #5** `[S]`  
**Description:** Treat the mobile admin drawer like an accessible dialog by adding a close button, Escape-key dismissal, focus return to the trigger, and body scroll lock while the drawer is open.  
**Target:** `app/admin/layout.tsx`  
**UI pattern:** Accessible drawer dialog

## Phase 5 — Priority Stack

### Quick Wins

| Rank | Remediation | Severity | Coverage | Effort | Why it lands here |
| --- | --- | --- | --- | --- | --- |
| 1 | Improve checkout selection feedback and return safety | [MAJOR] | [PARTIAL] | [S] | Prevents avoidable operator mistakes in a high-frequency workflow touching inventory condition data. |
| 2 | Fix mobile drawer dismissal/accessibility | [MAJOR] | [PARTIAL] | [S] | Affects every admin route on small screens and blocks clean keyboard/mobile navigation. |
| 3 | Reset all reservation filters together | [MAJOR] | [PARTIAL] | [XS] | Very high clarity gain for a low-effort fix in a core scheduling workflow. |
| 4 | Add RSVP loading and remaining-seat feedback | [MAJOR] | [PARTIAL] | [S] | Removes stale-state confusion and reduces capacity-related submission failures. |
| 5 | Align landing copy to current demo scope | [MINOR] | [PARTIAL] | [XS] | Small effort, immediate trust/consistency improvement for the first-time user journey. |

### Full Stack Rank

| Rank | Item | Severity | Coverage | Effort | Impact notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Checkout selection + return safety | [MAJOR] | [PARTIAL] | [S] | Directly improves the accuracy and confidence of the game checkout/return loop. |
| 2 | Mobile admin drawer accessibility | [MAJOR] | [PARTIAL] | [S] | Cross-cutting shell improvement for every admin workflow on narrow screens. |
| 3 | Reservation filter reset | [MAJOR] | [PARTIAL] | [XS] | Resolves a “why is my data still missing?” state in a daily workflow. |
| 4 | RSVP modal loading/capacity feedback | [MAJOR] | [PARTIAL] | [S] | Prevents stale RSVP displays and reduces failed add-RSVP attempts. |
| 5 | Landing page messaging alignment | [MINOR] | [PARTIAL] | [XS] | Keeps the marketing entry point honest about the actual demo experience. |

## Implementation Status

**Status:** All 5 remediations from this pass were implemented.

- **Landing page messaging aligned** — updated feature descriptions and CTA labels so the marketing surface now matches the seeded admin demo (`app/page.tsx`).
- **Reservation reset fixed** — replaced the partial reset with a reset-all flow that clears date/show-all/status/search together (`app/admin/reservations/page.tsx`).
- **Checkout feedback and return safety improved** — added selected-game confirmation + clear affordance, improved empty-search feedback, and made return condition selection explicit in both UI and API validation (`app/admin/checkout/components/CheckoutForm.tsx`, `app/admin/checkout/components/ReturnModal.tsx`, `app/api/checkout/[id]/return/route.ts`).
- **RSVP modal hardened** — modal now clears stale data on open, shows loading feedback, displays remaining seats, and blocks oversize RSVP submissions client-side (`app/admin/events/page.tsx`, `app/admin/events/components/RsvpModal.tsx`).
- **Mobile drawer made accessible** — added close control, Escape handling, focus return, and scroll lock for the admin navigation drawer (`app/admin/layout.tsx`).
- **Regression coverage added** — added lightweight source-level regression tests for all five fixes using Node’s built-in test runner (`tests/ux-audit-regressions.test.mjs`, `package.json`).

### Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
