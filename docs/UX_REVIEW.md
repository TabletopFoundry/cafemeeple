# CaféMeeple — UX & Developer Experience Audit

> **Auditor perspective**: Senior full-stack engineer encountering the codebase for the first time.
> **Date**: 2025-07-17
> **Scope**: Product UX, developer experience, PRD coverage, polish, and performance.

---

## 1. Executive Summary

CaféMeeple is an impressively complete demo-quality SaaS prototype. The codebase covers 6 of 10 PRD functional requirements with working CRUD flows, a polished dashboard with live analytics, and a coherent visual design language built on Tailwind + Lucide + Recharts. Setup is genuinely one-command (`npm install && npm run dev`) with auto-seeded SQLite — far better than most prototypes. However, the product has significant gaps between what the PRD specifies and what's implemented: there is no authentication, no multi-tenancy, no POS integration, no guest-facing reservation widget, no BGG import, no QR/copy-level tracking, and zero test coverage. The UI commits several accessibility sins (no ARIA attributes anywhere, `alert()` for error feedback, missing focus management in modals, no keyboard trap), and every page is a monolithic client component that re-fetches all data on every mutation. These are acceptable for a demo but would be blockers for pilot or production use.

---

## 2. Top Friction Points (Ranked by Developer/User Impact)

### F1 — Zero accessibility (WCAG compliance)
**Impact**: Blocks any public-facing deployment; PRD explicitly requires WCAG 2.1 AA.
- Zero `aria-*` attributes across the entire codebase (confirmed via grep — 0 matches).
- Modals (`CheckInModal`, `EventModal`, `RsvpModal`, `ReturnModal`, reservation modal) lack `role="dialog"`, `aria-modal="true"`, focus trapping, and `Escape` key handling.
- Every error in mutation flows uses `window.alert()` — 12 instances across 5 files — which is not screen-reader friendly and disrupts UI flow.
- Interactive table cards in floor map are `<button>` elements but lack `aria-label` describing their state.
- No visible focus indicators beyond browser defaults (no `focus-visible` classes, no custom outlines).
- Color-only status communication (table cards use green/amber/violet backgrounds) with no text alternative.

**Files**: `app/admin/tables/page.tsx`, `app/admin/events/page.tsx`, `app/admin/checkout/page.tsx`, `app/admin/reservations/page.tsx`, `app/admin/games/page.tsx`.

### F2 — No authentication or authorization
**Impact**: Critical security gap; all PRD personas assume role-based access.
- Anyone can access `/admin` and all API routes without authentication.
- No middleware, no session management, no RBAC.
- PRD FR-01 specifies Owner/Manager/Staff/Read-Only roles — none implemented.
- API routes have zero authorization checks; any client can POST/PUT/DELETE any entity.

### F3 — All admin pages are monolithic client components
**Impact**: Poor performance, no SSR benefits, large JS bundles, layout shift on load.
- Every admin page (`page.tsx`) is `"use client"` with `useEffect` fetching from API routes.
- The dashboard, games, tables, reservations, events, and checkout pages all follow the same pattern: `useState` + `useEffect` + full-page `LoadingSpinner` until data arrives.
- No React Server Components, no streaming, no Suspense boundaries, no progressive rendering.
- Layout shift is guaranteed: the sidebar renders, then main content shows a centered spinner, then content pops in.

**Files**: `app/admin/page.tsx:1`, `app/admin/games/page.tsx:1`, `app/admin/tables/page.tsx:1`, etc.

### F4 — `seedDatabase()` called in root layout on every request
**Impact**: Performance overhead on every page load; side-effect in render path.
- `app/layout.tsx:27` calls `seedDatabase()` synchronously during server rendering of the root layout.
- While `lib/db.ts` has a `seedChecked` guard, this is a module-level variable that resets on server restarts and is fragile in serverless environments.

**File**: `app/layout.tsx:27`, `lib/db.ts:10`.

### F5 — No test infrastructure whatsoever
**Impact**: No confidence in refactoring or regression detection; PRD-required acceptance criteria are unverifiable.
- Zero test files (grep for `test|spec|jest|vitest` returns no test files, only `package-lock.json` matches).
- No test runner configured in `package.json`.
- No CI/CD pipeline visible.
- 14 API routes with business logic (session check-in, checkout, return, billing calculations) have no automated validation.

### F6 — Sidebar not responsive / no mobile navigation
**Impact**: PRD specifies tablet-first front-of-house experience; sidebar breaks on mobile.
- `Sidebar.tsx` renders as a fixed 256px (`w-64`) column with no collapse/hamburger behavior.
- `AdminLayout` uses `flex min-h-screen` but the sidebar never hides on small screens.
- On mobile viewports, the sidebar consumes ~65% of screen width, leaving the main content area unusable.
- Landing page has responsive nav (hamburger on mobile) but admin does not.

**File**: `components/Sidebar.tsx:28`, `app/admin/layout.tsx:9`.

### F7 — Error handling uses `window.alert()` everywhere
**Impact**: Terrible UX; breaks flow, not dismissable inline, not accessible.
- 12 `alert()` calls across all admin pages for mutation failures.
- No toast/notification system exists.
- The `ErrorMessage` component in `components/ui.tsx` exists and is well-designed but is only used for initial data load errors, not mutation errors.

### F8 — Game search dropdown in checkout has z-index/positioning issues
**Impact**: Dropdown may render behind other content or overflow incorrectly.
- `app/admin/checkout/page.tsx:169`: search results dropdown uses `absolute z-10` but is inside a grid cell without `relative` positioning on the parent, making position unpredictable.
- Dropdown has no click-outside-to-dismiss behavior.
- No keyboard navigation (arrow keys, Enter to select) for the autocomplete.

**File**: `app/admin/checkout/page.tsx:155-186`.

---

## 3. PRD Feature Coverage Analysis

| PRD Requirement | Status | Notes |
|---|---|---|
| **FR-01** Org, Location, Role Setup | ❌ Not implemented | No auth, no roles, no org setup, no business hours config |
| **FR-02** Game Library Import (BGG/CSV) | ⚠️ Partial | Manual CRUD works; no BGG API integration, no CSV import |
| **FR-03** Physical Copy Tracking, QR, Condition | ⚠️ Partial | Condition tracking exists; no per-copy tracking (single record per title), no QR generation, no missing-piece logs |
| **FR-04** Walk-in Check-in, Timer, Cover Charge | ✅ Mostly complete | Check-in, per-person/per-table billing, session close all work; no timer display/adjustment, no pricing rules engine, no audit trail |
| **FR-05** Reservations, Waitlist, No-Show | ⚠️ Partial | CRUD + calendar/list views + status management work; no guest-facing widget, no waitlist queue, no grace period logic, no email confirmations |
| **FR-06** Game Checkout & Return | ✅ Mostly complete | Checkout to session, return with condition logging, history — all work. Missing: transfer between tables, staff attribution |
| **FR-07** POS Sync (Square) | ❌ Not implemented | No external integration of any kind |
| **FR-08** Events & RSVPs | ✅ Mostly complete | Full CRUD, RSVP management, capacity tracking. Missing: recurring templates, attendance check-in, waitlist on capacity full |
| **FR-09** Analytics Dashboard | ⚠️ Partial | Today's metrics + 30-day revenue + popular games + alerts work well. Missing: date range filtering, CSV export, table utilization, session duration analytics |
| **FR-10** Staff Recommendation | ⚠️ Partial | Game library has player count, complexity, and play time filters that serve as basic recommendation. No dedicated recommendation flow |

**Overall PRD coverage**: ~40% of v1 scope implemented. Core CRUD flows are solid; operational workflows, integrations, and security layers are entirely absent.

---

## 4. Quick Wins (< 1 day each)

### QW-1 [P0] — Replace all `alert()` calls with inline toast notifications
Create a lightweight toast component (or use the existing `ErrorMessage` pattern) and replace all 12 `alert()` instances. This immediately improves UX and accessibility.
```
Files to change: tables/page.tsx, games/page.tsx, events/page.tsx, checkout/page.tsx, reservations/page.tsx
```

### QW-2 [P0] — Add ARIA attributes to all modals
Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the modal title, and trap focus within modals. Add `Escape` key to close. All 6 modals follow the same pattern — can be refactored into a shared `<Modal>` wrapper.
```
Files: CheckInModal, CheckoutModal, EventModal, RsvpModal, ReturnModal, ReservationModal
```

### QW-3 [P1] — Make sidebar responsive with hamburger toggle
Add a mobile hamburger button and hide the sidebar behind a slide-out drawer on screens < `lg`. Use a `useState` toggle in `AdminLayout` and pass to `Sidebar`.
```
Files: components/Sidebar.tsx, app/admin/layout.tsx
```

### QW-4 [P1] — Add `aria-label` to all icon-only buttons
Edit and Delete buttons throughout the app use only icons (`<Edit2 size={14} />`, `<Trash2 size={14} />`) with no accessible label. Add `aria-label="Edit game"` / `aria-label="Delete game"` etc.
```
Files: games/page.tsx, events/page.tsx, reservations/page.tsx
```

### QW-5 [P1] — Add skeleton loading states instead of full-page spinners
Replace the `<LoadingSpinner size="lg" />` full-page pattern with skeleton cards using the existing `<LoadingCard>` component from `ui.tsx` (which is defined but never used anywhere).
```
Files: All admin page.tsx files
```

### QW-6 [P2] — Fix game search dropdown positioning
Wrap the game search input in a `relative` container and add click-outside-to-close behavior (a simple `useEffect` with `mousedown` listener).
```
File: app/admin/checkout/page.tsx:155-186
```

### QW-7 [P2] — Move `seedDatabase()` out of root layout render
Move the seed call to a one-time initialization in `lib/db.ts` (within `getDb()`, which already has `ensureSeedData`) and remove the import from `layout.tsx`.
```
Files: app/layout.tsx, lib/seed.ts
```

### QW-8 [P2] — Add `<title>` per admin page
Each admin page should set a descriptive document title (e.g., "Game Library — CaféMeeple"). Currently all pages inherit the root layout title. Use Next.js `metadata` export or `<title>` in head.

### QW-9 [P2] — Footer year is hardcoded to 2024
`app/page.tsx:255`: `© 2024 CaféMeeple` — should use `new Date().getFullYear()`.

---

## 5. Medium-Term Improvements (Days to 1 Sprint)

### MT-1 [P0] — Add authentication and basic RBAC
- Implement NextAuth.js or a simple session-based auth system.
- Add middleware to protect `/admin` routes.
- Add server-side authorization checks on all API routes.
- Create at minimum Owner and Staff roles.
- This is a prerequisite for any pilot deployment.

### MT-2 [P0] — Add test infrastructure and core test coverage
- Install Vitest + React Testing Library.
- Add API route tests for all 14 endpoints (especially business logic: session billing, checkout availability checks, reservation conflict detection).
- Add component tests for critical flows (check-in, checkout, return).
- Add `npm test` script to `package.json`.
- Target: cover all API routes and modal form submissions.

### MT-3 [P1] — Convert admin pages to use React Server Components where possible
- Dashboard stats, game library listing, event listing can all be server-rendered.
- Use RSC for data fetching and client components only for interactive parts (modals, filters).
- This eliminates layout shift, reduces JS bundle, and improves TTI significantly.
- The current pattern of "client component fetches from API route that reads SQLite" adds unnecessary round-trips when RSC can read the DB directly.

### MT-4 [P1] — Implement proper form validation
- Currently no client-side validation beyond HTML `required` on a few fields.
- Add field-level error messages (e.g., party size > table capacity should show inline, not after submission).
- Validate email format, phone format, date ranges, numeric bounds.
- Show validation state visually (red borders, helper text).

### MT-5 [P1] — Add confirmation/undo for destructive actions
- Game deletion, event deletion, reservation cancellation, and session close use `window.confirm()` — another browser native dialog that breaks UX.
- Replace with inline confirmation UI or an undo-able toast pattern.
- PRD explicitly requires: "All destructive actions require confirmation or undo path."

### MT-6 [P1] — Implement BGG import and CSV import for game library
- PRD FR-02 is a "Must" priority — the #1 onboarding flow for new cafés.
- Add a BGG collection URL import that fetches game metadata via the BGG XML API.
- Add CSV upload with column mapping and preview.
- Show import progress and error rows for review.

### MT-7 [P2] — Add pagination to game library and checkout history
- Games page loads all 100+ games at once with no pagination.
- Checkout history is capped at 150 (`LIMIT 150` in API) with no pagination UI.
- For a real café with 500+ games, this will cause performance issues.
- Add cursor-based or offset pagination with page controls.

### MT-8 [P2] — Add date range filtering to the analytics dashboard
- PRD FR-09 requires date range filtering; current dashboard is hardcoded to "today" stats and "30-day" revenue.
- Add a date range picker and re-query analytics within the selected window.

### MT-9 [P2] — Add CSV export for analytics and game library
- PRD FR-09 requires export capability.
- Add "Export CSV" buttons to the dashboard, game library, checkout history, and reservation list.

### MT-10 [P2] — Add real-time or periodic auto-refresh for floor view
- Tables page is a point-in-time snapshot; staff must manually click "Refresh."
- Add a 30-second polling interval or use Server-Sent Events for the floor view.
- The timer elapsed time (`formatElapsed`) only updates on page load — it should tick live.

---

## 6. Long-Term Investments (Multi-sprint)

### LT-1 [P0] — Multi-tenancy architecture
- PRD specifies multi-tenant SaaS; current DB has no tenant/org/location scoping.
- Every table needs an `organization_id` or `location_id` foreign key.
- All queries need tenant-scoping middleware.
- This is foundational and touches every file — do it before adding more features.

### LT-2 [P1] — Guest-facing reservation widget
- PRD FR-05 requires an embeddable booking widget for café websites.
- Build as a standalone component/page that can be iframed.
- Must be mobile-first, no-auth, minimal steps.

### LT-3 [P1] — Per-copy game tracking with QR codes
- PRD FR-03 requires tracking individual physical copies (not just title-level inventory).
- Requires a `game_copies` table (one row per physical copy, linked to `games` catalog).
- QR code generation for labels.
- Checkout should select a specific copy, not just decrement a counter.

### LT-4 [P1] — POS integration (Square)
- PRD FR-07 "Should" priority for v1.
- Session billing should sync to Square as line items.
- Requires OAuth flow, idempotent sync, retry/pending states.

### LT-5 [P2] — Notification system (email/SMS)
- Reservation confirmations, reminders, cancellation notices.
- Event RSVP confirmations.
- Waitlist promotion notifications.
- Requires email provider integration and template system.

### LT-6 [P2] — Offline resilience / optimistic updates
- PRD NFR requires core workflows to survive internet interruptions.
- Currently all mutations are fire-and-forget with `alert()` on failure.
- Implement optimistic UI updates with rollback on failure.
- Add retry queues for failed mutations.

### LT-7 [P2] — Component library extraction
- `components/ui.tsx` is a single 127-line file containing 6 unrelated components.
- As the app grows, split into `components/ui/` directory with one file per component.
- Add Storybook for visual testing and documentation.

---

## 7. Comparison to Best Practices

| Area | Current State | Industry Best Practice | Gap |
|---|---|---|---|
| **Accessibility** | Zero ARIA, zero focus management, `alert()` for errors | WCAG 2.1 AA, focus trapping in modals, screen-reader announcements | Critical |
| **Testing** | Zero tests | 80%+ critical path coverage, CI-gated PRs | Critical |
| **Auth/Security** | No auth, no RBAC, open API | Middleware-based auth, server-side RBAC, CSRF protection | Critical |
| **Error UX** | `window.alert()` × 12, `window.confirm()` × 3 | Inline toasts, undo patterns, contextual error messages | Major |
| **Mobile/Tablet** | Sidebar breaks on mobile, no responsive admin | Responsive sidebar, touch-optimized table cards, bottom nav on mobile | Major |
| **SSR/Performance** | 100% client-side rendering in admin | RSC for data, client for interaction, streaming for progressive load | Moderate |
| **Data Loading** | Full page spinner → content pop | Skeleton screens, streaming, optimistic updates | Moderate |
| **Component Architecture** | All UI in page files, one `ui.tsx` shared file | Atomic design, component library, Storybook | Moderate |
| **State Management** | `useState` × ~50 across app, prop drilling | Consider URL state for filters, server state with React Query or RSC | Minor |
| **Code Organization** | Flat file structure, works for current size | Good for now; will need splitting at ~15 pages | Acceptable |
| **Onboarding/Setup** | Excellent: `npm install && npm run dev`, auto-seed | This is best-in-class for a prototype | Strong ✅ |
| **README** | Complete, accurate, well-structured | Matches expectations | Strong ✅ |
| **Visual Design** | Consistent Tailwind, good color system, clean layout | Professional quality for a prototype | Strong ✅ |
| **API Design** | RESTful, consistent error format, proper HTTP status codes | Good conventions | Strong ✅ |
| **Database Schema** | Well-indexed, foreign keys, WAL mode | Solid foundation | Strong ✅ |

---

## 8. Summary of Priorities

| Priority | Count | Key Items |
|---|---|---|
| **P0 — Must fix** | 6 | Accessibility (ARIA + focus), auth/RBAC, replace `alert()`, test infrastructure, multi-tenancy, destructive action confirmations |
| **P1 — Should fix** | 9 | Responsive sidebar, RSC migration, form validation, BGG/CSV import, guest reservation widget, per-copy tracking, skeleton loaders |
| **P2 — Nice to have** | 9 | Pagination, date range analytics, CSV export, auto-refresh floor, dropdown positioning, per-page titles, footer year, POS integration, component library |

---

*This audit was performed by static code analysis without running the application. Some visual/interaction issues may differ when tested in-browser.*
