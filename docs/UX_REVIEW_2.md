# CaféMeeple — Second-Pass UX & Accessibility Audit

> **Auditor perspective**: Senior full-stack engineer performing a second review after initial fixes were implemented.
> **Date**: 2025-07-17
> **Scope**: Remaining UX gaps, accessibility issues, visual polish, responsive edge cases, error handling gaps, regressions.
> **Baseline**: Findings from `docs/UX_REVIEW.md` — fixes that were implemented include: `Modal.tsx` wrapper with focus trap + ARIA, `Toast.tsx` notification system, `ConfirmDialog.tsx` for destructive actions, `ErrorBoundary.tsx`, responsive sidebar with hamburger, skeleton loading states, `aria-label` on icon buttons, `focus-visible` ring styles.

---

## 1. Executive Summary

The first review's critical fixes were implemented well. The app now has a shared `Modal` component with `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape-to-close, and focus trapping. `alert()` and `confirm()` calls are fully eliminated — replaced by `Toast` and `ConfirmDialog` respectively. The sidebar is responsive with a mobile hamburger drawer. Skeleton loading states replace full-page spinners. These were the right calls and they landed cleanly.

However, several **second-order accessibility and UX issues** remain. The Modal's focus trap has edge-case bugs. Toast error announcements use `aria-live="polite"` instead of `"assertive"`. The game search combobox has ARIA roles but no keyboard navigation. View toggle buttons across 4 pages lack `aria-pressed` state. No form has inline validation — errors only surface after submission via toast. The `LoadingSpinner` component (still used in the games page) has no accessible loading announcement. And the hardcoded footer year (`© 2024`) and `seedDatabase()` in root layout render path — two of the easiest quick wins from the first review — were not addressed.

**Overall**: The P0 accessibility and UX blockers from Review 1 are resolved. What remains is a set of P1 polish items that separate "demo" from "pilot-ready."

---

## 2. Findings

### P0 — Must Fix (Blocks pilot / creates real user harm)

#### P0-1: Toast error announcements are not assertive
**Files**: `components/Toast.tsx:47,69`
**Issue**: The toast container uses `aria-live="polite"`, and each toast has `role="alert"`. For success/info messages `polite` is correct, but error toasts need `aria-live="assertive"` so screen readers interrupt to announce failures immediately. Currently, if a user submits a form and it fails, the error toast may be delayed or missed entirely by assistive tech during other announcements.
**Fix**: Use `aria-live="assertive"` on the container or conditionally per-toast variant. Alternatively, render error toasts in a separate `aria-live="assertive"` region.

#### P0-2: Toast `setTimeout` is never cleaned up on unmount
**File**: `components/Toast.tsx:34-36`
**Issue**: `setTimeout` inside `addToast` captures `setToasts` but is never cleared if the `ToastProvider` unmounts. In development with React StrictMode (double-mount), or in tests, this causes state updates on unmounted components. In edge cases (route changes during toast display), this can throw React warnings or silently fail.
**Fix**: Track timeout IDs and clear them in a cleanup effect, or use `useRef` to track mounted state.

#### P0-3: Game search combobox has no keyboard navigation
**File**: `app/admin/checkout/page.tsx:163-202`
**Issue**: The game search input correctly has `role="combobox"`, `aria-expanded`, and `aria-autocomplete="list"`, and the dropdown items have `role="option"`. But there is **zero `onKeyDown` handling** — no ArrowUp/ArrowDown to navigate options, no Enter to select, no Escape to close the dropdown. This means the combobox is ARIA-labeled as interactive but keyboard users **cannot use it**. This is worse than having no ARIA at all — it sets expectations that aren't met.
**Fix**: Add `onKeyDown` handler with arrow key navigation, Enter selection, and Escape dismissal. Track active descendant with `aria-activedescendant`.

#### P0-4: `seedDatabase()` still called in root layout render path
**File**: `app/layout.tsx:27`
**Issue**: This was flagged as QW-7 in Review 1 and not addressed. `seedDatabase()` is called synchronously during server render of the root layout on every request. The module-level `seedChecked` guard in `lib/db.ts` resets on server restarts and is fragile in serverless (each cold start re-seeds). This is a side-effect in the render path — an anti-pattern in React Server Components.
**Fix**: Move seed logic into `getDb()` initialization in `lib/db.ts` (which already calls `ensureSeedData()`). Remove the import and call from `layout.tsx`.

---

### P1 — Should Fix (Noticeable polish gaps / accessibility incomplete)

#### P1-1: View toggle buttons lack `aria-pressed` across all pages
**Files**: `app/admin/tables/page.tsx:136-147`, `app/admin/games/page.tsx:123-135`, `app/admin/checkout/page.tsx:218-235`, `app/admin/reservations/page.tsx:142-160`
**Issue**: Four pages have segmented toggle buttons (Map/List, Grid/List, Active/History, Calendar/List). These use visual styling (bg color change) to indicate the active state but provide no semantic indicator. Screen readers announce them as plain buttons with no pressed/selected state. Per WAI-ARIA, toggle buttons should use `aria-pressed="true|false"` or the group should use `role="tablist"` with `role="tab"` and `aria-selected`.
**Fix**: Add `aria-pressed={viewMode === "map"}` to each toggle button, or refactor to a `role="tablist"` pattern with `role="tab"` + `aria-selected` + `role="tabpanel"`.

#### P1-2: `LoadingSpinner` has no accessible loading announcement
**File**: `components/ui.tsx:1-14`
**Issue**: The spinner is a purely visual animated `<div>` with no text alternative. Screen readers see an empty container. When it appears (e.g., games page during search debounce at line 214), users who can't see the screen have no indication that content is loading.
**Fix**: Add `role="status"` and `aria-label="Loading"` to the spinner wrapper, or include a visually-hidden text label: `<span className="sr-only">Loading…</span>`.

#### P1-3: Modal does not lock body scroll
**File**: `components/Modal.tsx:26-71`
**Issue**: When a modal opens, the page behind it remains scrollable. Users can scroll the background content while the modal overlay is visible, which is disorienting and can cause layout confusion, especially on mobile where touch scrolling easily bleeds through. This is a standard modal behavior that's missing.
**Fix**: Add `document.body.style.overflow = "hidden"` on mount and restore on unmount inside the `useEffect`.

#### P1-4: Modal `document.activeElement` cast is unsafe
**File**: `components/Modal.tsx:28`
**Issue**: `document.activeElement as HTMLElement` can be `null` (when no element is focused) or `document.body` (which isn't useful to restore to). On cleanup (line 69), `previousFocusRef.current?.focus()` may try to focus the `<body>` or a now-removed element, producing a no-op or error in edge cases (e.g., modal opened from a dynamic list item that was removed).
**Fix**: Guard with `if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body)`.

#### P1-5: No inline form validation on any modal
**Files**: All modal forms across `games/page.tsx:468-577`, `events/page.tsx:310-412`, `reservations/page.tsx:424-539`, `tables/page.tsx:347-444`, `checkout/page.tsx:365-406`
**Issue**: Every form relies solely on HTML `required` attributes and server-side errors surfaced via toast. There are no inline validation messages (red borders, helper text below fields). Examples of what's missing:
- Party size > table capacity → no client-side check (tables/page.tsx:379)
- Min players > max players → silently sent to API (games/page.tsx:505-506)
- Event end time before start time → no validation (events/page.tsx:354-371)
- Reservation in the past → accepted without warning
- Email format → no format validation (reservations/page.tsx:440-445)
- Negative numbers in numeric fields → `min={1}` on HTML input is trivially bypassable

**Fix**: Add field-level validation state (`errors` object) and display inline error messages below relevant fields. Validate on blur and on submit.

#### P1-6: Event form modal uses fixed `grid-cols-3` on mobile
**File**: `app/admin/events/page.tsx:354`
**Issue**: The Start Time / End Time / Capacity row uses `grid grid-cols-3 gap-4` with no responsive breakpoint. On mobile viewports (< 640px), three columns of time/number inputs are severely cramped — inputs become ~90px wide, making them difficult to tap and read.
**Fix**: Change to `grid grid-cols-1 sm:grid-cols-3 gap-4`.

#### P1-7: Reservation form modal uses fixed `grid-cols-3` on mobile
**File**: `app/admin/reservations/page.tsx:479`
**Issue**: Same as P1-6. The Party Size / Duration / Table row is `grid grid-cols-3 gap-4` with no responsive breakpoint.
**Fix**: Change to `grid grid-cols-1 sm:grid-cols-3 gap-4`.

#### P1-8: Reservation form modal uses fixed `grid-cols-2` on mobile
**Files**: `app/admin/reservations/page.tsx:437,457`, `app/admin/events/page.tsx:330`
**Issue**: Multiple 2-column grids (`grid grid-cols-2 gap-4`) in form modals have no responsive breakpoint. On small mobile screens these are tight but usable — however on very narrow devices (320px viewport, common for older phones), fields overflow or become unusable.
**Fix**: Change to `grid grid-cols-1 sm:grid-cols-2 gap-4`.

#### P1-9: Dashboard returns blank screen when `data` is null after loading
**File**: `app/admin/page.tsx:100-102`
**Issue**: After loading completes successfully but with a null response, `if (!data) return null;` renders a blank white page with no feedback. While unlikely in normal operation, a malformed API response could trigger this state. Users see the sidebar but a completely empty main area.
**Fix**: Return an `<ErrorMessage>` or `<EmptyState>` instead of `null`.

#### P1-10: Charts have no accessible text alternative
**File**: `app/admin/page.tsx:166-200`
**Issue**: The Recharts `BarChart` and `PieChart` render as SVG with no text fallback. Screen readers encounter raw SVG elements with no summary. The revenue breakdown data is only consumable visually.
**Fix**: Add a visually-hidden summary table or `aria-label` on the chart containers describing the data (e.g., "Bar chart showing 30-day revenue by category: Cover charges $X, F&B $Y…").

#### P1-11: Session close ("Close session") has no confirmation dialog
**File**: `app/admin/tables/page.tsx:477-483`
**Issue**: Clicking "Close session" in the CheckoutModal directly calls `onConfirm` → `handleCheckout` which ends the billing session immediately. There's no `ConfirmDialog` step. This is a destructive/irreversible action (ends billing, frees the table) that should require explicit confirmation, especially since accidental clicks on the billing summary modal are easy. Games, events, and reservations all use `ConfirmDialog` for their destructive actions — this is an inconsistency.
**Fix**: Wrap the close action in a `ConfirmDialog` or add a two-step confirmation within the existing modal.

---

### P2 — Nice to Have (Polish / best practices / minor edge cases)

#### P2-1: Footer year still hardcoded to 2024
**File**: `app/page.tsx:255`
**Issue**: Flagged as QW-9 in Review 1 and not addressed. `© 2024 CaféMeeple` should be dynamic.
**Fix**: Replace with `© {new Date().getFullYear()} CaféMeeple`.

#### P2-2: Toast dismiss button has no visible focus indicator
**File**: `components/Toast.tsx:73-79`
**Issue**: The dismiss (X) button has `hover:bg-white/20` but no `focus-visible` ring styling. Keyboard users tabbing through toasts can't tell when the dismiss button is focused.
**Fix**: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white` to the dismiss button.

#### P2-3: Toast container can overflow on narrow screens
**File**: `components/Toast.tsx:49`
**Issue**: Toast container is `fixed bottom-4 right-4 max-w-sm`. On screens < 400px wide, toasts extend off the right edge. No mobile adaptation exists.
**Fix**: Change to `fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm` so toasts are full-width on mobile.

#### P2-4: No toast deduplication or stack limit
**File**: `components/Toast.tsx:31-37`
**Issue**: Rapidly triggering errors (e.g., clicking a failing submit button repeatedly) creates unlimited stacked toasts. There's no cap or deduplication. With enough toasts, they overflow the viewport.
**Fix**: Add a max count (e.g., 5) with oldest-first eviction, and/or deduplicate identical messages within a time window.

#### P2-5: Toast `nextId` is a module-global counter
**File**: `components/Toast.tsx:20`
**Issue**: `let nextId = 0` is module-scoped. In React StrictMode or hot-reload scenarios, this persists across remounts and can grow indefinitely. Not a practical bug, but not SSR-safe in edge cases where module state doesn't reset.
**Fix**: Use `useRef` inside the provider to track the ID counter.

#### P2-6: ConfirmDialog buttons can wrap awkwardly on small screens
**File**: `components/ConfirmDialog.tsx:33`
**Issue**: Buttons use `flex justify-end gap-3` with no `flex-wrap`. On very narrow modals or with long button labels (e.g., "Cancel reservation"), buttons may overflow rather than stacking.
**Fix**: Add `flex-wrap` or change to `flex flex-col-reverse sm:flex-row sm:justify-end gap-3` for graceful mobile stacking.

#### P2-7: ConfirmDialog has no loading/disabled state for async confirmations
**File**: `components/ConfirmDialog.tsx:41-47`
**Issue**: `onConfirm` is assumed synchronous. If the delete API call takes time, users can double-click the confirm button, triggering duplicate requests. The button shows no loading state.
**Fix**: Accept `loading?: boolean` prop and disable the confirm button while loading, or make `onConfirm` return a Promise and track pending state internally.

#### P2-8: ErrorBoundary has no `componentDidCatch` for error logging
**File**: `components/ErrorBoundary.tsx:19-21`
**Issue**: `getDerivedStateFromError` captures the error for display, but there's no `componentDidCatch` to log it. In production, render errors silently disappear with no telemetry.
**Fix**: Add `componentDidCatch(error, errorInfo)` with `console.error` at minimum, or wire to an error reporting service.

#### P2-9: ErrorBoundary reset can re-crash immediately
**File**: `components/ErrorBoundary.tsx:34-39`
**Issue**: "Try again" button clears `hasError` state, causing the same children to re-render. If the error is deterministic (bad prop, missing data), the boundary crashes again immediately, creating a flash loop.
**Fix**: Accept a `resetKeys` prop (like react-error-boundary) that triggers reset on dependency change, or increment a key on the child to force a full remount.

#### P2-10: `EmptyState` icon string has no `aria-hidden` treatment
**File**: `components/ui.tsx:38`
**Issue**: The emoji icon (e.g., "🎲", "📅") is rendered as plain text. Screen readers will announce it literally ("die face-5", "calendar"). Since the icon is decorative (the title conveys the meaning), it should be hidden.
**Fix**: Wrap in `<span aria-hidden="true">{icon}</span>`.

#### P2-11: `ErrorMessage` component has no `role="alert"` 
**File**: `components/ui.tsx:53-66`
**Issue**: The error display component renders a styled div but has no ARIA role. When it appears (e.g., on API load failure), screen readers don't announce it as an error — users must navigate to it manually.
**Fix**: Add `role="alert"` to the outer div.

#### P2-12: `Badge` uses color-only differentiation
**File**: `components/ui.tsx:111-125`
**Issue**: Badge variants (success=green, warning=amber, danger=red) rely solely on color to convey meaning. Color-blind users (8% of males) cannot distinguish between success and danger badges. The text content usually helps, but status labels like "confirmed" vs "cancelled" may not be immediately obvious without color context.
**Fix**: Consider adding a small icon prefix per variant (✓ for success, ⚠ for warning, ✕ for danger) or ensure text always carries the semantic meaning.

#### P2-13: Calendar view 7-column grid is cramped on mobile
**File**: `app/admin/reservations/page.tsx:201`
**Issue**: The weekly calendar uses `grid grid-cols-7` with no responsive alternative. On mobile (~375px), each day cell is ~50px wide — dates and badges overflow or become untappable.
**Fix**: On mobile, show 3-day or single-day view, or make the grid horizontally scrollable with `overflow-x-auto`.

#### P2-14: Checkout page tables don't scroll on mobile
**File**: `app/admin/checkout/page.tsx:245-284`
**Issue**: The active checkouts table uses `w-full` but has no `overflow-x-auto` wrapper. On mobile, the table columns (Game, Table, Party, Checked Out, Action) overflow the viewport with no horizontal scroll.
**Fix**: Wrap in a `<div className="overflow-x-auto">` container (like the games list view already does).

#### P2-15: Return modal button order is reversed from convention
**File**: `app/admin/checkout/page.tsx:390-403`
**Issue**: The Return modal places the primary action ("Return Game") first and "Cancel" second (`flex gap-3`). This is the opposite order from every other modal in the app (which all put Cancel first, then primary action on the right via `flex justify-end gap-3`). Inconsistency in button placement increases user error.
**Fix**: Match the convention used in all other modals: Cancel left, primary right, with `flex justify-end gap-3`.

#### P2-16: No per-page `<title>` in admin
**Files**: All `app/admin/*/page.tsx` files
**Issue**: Flagged as QW-8 in Review 1 and not addressed. Every admin page inherits the root layout title "CaféMeeple — Board Game Café Management". Browser tabs, history, and screen reader page announcements all show the same generic title regardless of which section the user is in.
**Fix**: Export `metadata` (for server components) or use `document.title` / a `<Head>` component in each admin page to set section-specific titles like "Game Library — CaféMeeple".

#### P2-17: Admin layout `role="main"` is deprecated usage
**File**: `app/admin/layout.tsx:50`
**Issue**: `<main role="main">` is redundant — the `<main>` element already has an implicit `main` role. While not harmful, it's unnecessary and produces lint warnings in some accessibility auditors.
**Fix**: Remove `role="main"`.

#### P2-18: Games page shows `LoadingSpinner` during search debounce instead of preserving stale data
**File**: `app/admin/games/page.tsx:214`
**Issue**: When a user types in the search box, after 250ms debounce the page sets `loading = true` and shows `<LoadingSpinner size="lg" />`, replacing all visible game cards. This creates a jarring flash on every keystroke (after debounce). Better UX would preserve the previous results while loading, showing a subtle loading indicator (e.g., spinner in the search input or a progress bar).
**Fix**: Don't clear `games` state during refetch — keep showing stale data with an overlay spinner or inline indicator until new data arrives.

---

## 3. Summary of Issues by Priority

| Priority | Count | Key Themes |
|---|---|---|
| **P0** | 4 | Toast `assertive` for errors, toast cleanup leak, combobox keyboard nav, seedDatabase in render |
| **P1** | 11 | `aria-pressed` on toggles, spinner accessibility, modal scroll lock, form validation, responsive grids, session close confirmation |
| **P2** | 18 | Footer year, toast polish, confirm dialog edge cases, error boundary logging, badge color-only, mobile table overflow, button order consistency |

---

## 4. First Review Items — Status Check

| Review 1 Item | Status | Notes |
|---|---|---|
| **QW-1** Replace `alert()` → Toast | ✅ Done | All 12 `alert()` calls replaced. Toast system works well. |
| **QW-2** ARIA on modals | ✅ Done | `Modal.tsx` has `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape key. |
| **QW-3** Responsive sidebar | ✅ Done | Hamburger + slide-out drawer on mobile, overlay backdrop, `onNavigate` close. |
| **QW-4** `aria-label` on icon buttons | ✅ Done | Edit/Delete buttons across games, events, reservations all have descriptive labels. |
| **QW-5** Skeleton loading states | ✅ Done | `LoadingCard` skeletons replace full-page spinners on dashboard, tables, checkout, events, reservations. |
| **QW-6** Game search dropdown positioning | ⚠️ Partial | Parent now has `relative` class. But no click-outside-to-close and no keyboard navigation (see P0-3). |
| **QW-7** Move `seedDatabase()` out of layout | ❌ Not done | Still called at `layout.tsx:27` (see P0-4). |
| **QW-8** Per-page `<title>` | ❌ Not done | All pages still inherit root title (see P2-16). |
| **QW-9** Footer year hardcoded | ❌ Not done | Still `© 2024` at `page.tsx:255` (see P2-1). |
| **MT-5** ConfirmDialog for destructive actions | ✅ Done | Games, events, reservations all use `ConfirmDialog`. Missing only for session close (see P1-11). |

---

## 5. Recommended Fix Order

**Sprint 1 (1-2 days) — P0 items:**
1. P0-3: Add keyboard nav to game search combobox
2. P0-1: Make error toasts use `aria-live="assertive"`
3. P0-2: Clean up toast timeouts on unmount
4. P0-4: Move `seedDatabase()` out of layout render

**Sprint 2 (2-3 days) — High-impact P1:**
5. P1-5: Add inline form validation to all modals
6. P1-1: Add `aria-pressed` to all view toggle buttons
7. P1-3: Add body scroll lock to Modal
8. P1-11: Add ConfirmDialog for session close
9. P1-6, P1-7, P1-8: Fix fixed-column grids to be responsive

**Sprint 3 (1-2 days) — Remaining P1 + quick P2s:**
10. P1-2: Add `role="status"` to LoadingSpinner
11. P1-9: Handle null dashboard data with EmptyState
12. P1-10: Add accessible text for charts
13. P2-1, P2-16, P2-17: Footer year, per-page titles, remove redundant role
14. P2-10, P2-11, P2-12: EmptyState/ErrorMessage/Badge accessibility

---

*This audit was performed by static code analysis of all source files. Browser testing may reveal additional visual/interaction issues not caught by code review.*
