import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("landing page presents CaféMeeple as a seeded admin demo", () => {
  const source = readSource("app/page.tsx");

  assert.match(source, /Board Game Café Ops Demo/);
  assert.match(source, /Seeded admin demo for board game cafés/);
  assert.match(source, /Launch Admin Demo →/);
  assert.match(source, /100\+ seeded games/);
  assert.match(source, /What this demo is built to validate/);
  assert.doesNotMatch(source, /Cafés Served/);
  assert.doesNotMatch(source, /\$49/);
  assert.doesNotMatch(source, /Loved by café owners/);
});

test("reservations reset button clears all active filters", () => {
  const source = readSource("app/admin/reservations/page.tsx");

  assert.match(source, /const resetAllFilters = \(\) => \{/);
  assert.match(source, /setSelectedDate\(today\);/);
  assert.match(source, /setShowAll\(false\);/);
  assert.match(source, /setStatusFilter\(""\);/);
  assert.match(source, /setSearch\(""\);/);
  assert.match(source, /Reset all filters/);
});

test("reservation table assignment surfaces live states and blocks maintenance tables", () => {
  const modalSource = readSource("app/admin/reservations/components/ReservationModal.tsx");
  const createRouteSource = readSource("app/api/reservations/route.ts");
  const updateRouteSource = readSource("app/api/reservations/[id]/route.ts");

  assert.match(modalSource, /In service now/);
  assert.match(modalSource, /Leave this on Auto-assign to keep the booking flexible\./);
  assert.match(modalSource, /status === "maintenance" && !isCurrentSelection/);
  assert.match(createRouteSource, /TABLE_UNAVAILABLE/);
  assert.match(updateRouteSource, /TABLE_UNAVAILABLE/);
});

test("reservation status changes surface success feedback", () => {
  const source = readSource("app/admin/reservations/page.tsx");

  assert.match(source, /Reservation confirmed/);
  assert.match(source, /Reservation marked as no-show/);
  assert.match(source, /"success"/);
});

test("checkout flow shows selected-game feedback and requires explicit return condition", () => {
  const checkoutFormSource = readSource("app/admin/checkout/components/CheckoutForm.tsx");
  const returnModalSource = readSource("app/admin/checkout/components/ReturnModal.tsx");
  const returnRouteSource = readSource("app/api/checkout/[id]/return/route.ts");

  assert.match(checkoutFormSource, /Selected game:/);
  assert.match(checkoutFormSource, /No available games match your search\./);
  assert.match(returnModalSource, /Select the condition observed on return/);
  assert.match(returnModalSource, /disabled=\{!condition\}/);
  assert.match(returnRouteSource, /validateRequired\(return_condition, \"return_condition\"\)/);
});

test("checkout history can load past the first 50 returned records", () => {
  const pageSource = readSource("app/admin/checkout/page.tsx");
  const routeSource = readSource("app/api/checkout/route.ts");

  assert.match(pageSource, /\/api\/checkout\?limit=1000/);
  assert.match(pageSource, /const \[historyVisibleCount, setHistoryVisibleCount\] = useState\(HISTORY_PAGE_SIZE\);/);
  assert.match(pageSource, /Load 50 more/);
  assert.match(routeSource, /const limitParam = Number\(url.searchParams.get\(\"limit\"\) \|\| 250\);/);
  assert.match(routeSource, /LIMIT \? OFFSET \?/);
});

test("game library filters expose reset recovery and active-filter feedback", () => {
  const gamesPageSource = readSource("app/admin/games/page.tsx");
  const filterBarSource = readSource("app/admin/games/components/GameFilterBar.tsx");

  assert.match(gamesPageSource, /const activeFilterCount = \[/);
  assert.match(gamesPageSource, /const resetFilters = \(\) => \{/);
  assert.match(gamesPageSource, /setReplacementOnly\(false\);/);
  assert.match(filterBarSource, /No filters active\./);
  assert.match(filterBarSource, /Reset filters/);
});

test("event RSVP modal surfaces loading and remaining-seat guidance", () => {
  const eventsPageSource = readSource("app/admin/events/page.tsx");
  const rsvpModalSource = readSource("app/admin/events/components/RsvpModal.tsx");
  const rsvpRouteSource = readSource("app/api/events/[id]/rsvps/route.ts");

  assert.match(eventsPageSource, /const \[loadingRsvps, setLoadingRsvps\] = useState\(false\);/);
  assert.match(eventsPageSource, /setRsvps\(\[\]\);/);
  assert.match(rsvpModalSource, /Loading attendee totals\.\.\./);
  assert.match(rsvpModalSource, /Loading RSVPs\.\.\./);
  assert.match(rsvpModalSource, /This event is currently full\./);
  assert.match(rsvpModalSource, /RSVPs unavailable/);
  assert.match(rsvpModalSource, /disabled=\{!canOpenAdd\}/);
  assert.match(rsvpRouteSource, /RSVPs are closed for this event/);
});

test("reservation zero states explain when filters hide results", () => {
  const reservationsPageSource = readSource("app/admin/reservations/page.tsx");
  const reservationListSource = readSource("app/admin/reservations/components/ReservationList.tsx");
  const reservationCalendarSource = readSource("app/admin/reservations/components/ReservationCalendar.tsx");

  assert.match(reservationsPageSource, /hasActiveFilters=\{hasActiveFilters\}/);
  assert.match(reservationsPageSource, /onResetFilters=\{resetAllFilters\}/);
  assert.match(reservationListSource, /No reservations match the current filters/);
  assert.match(reservationCalendarSource, /No reservations match the selected filters/);
  assert.match(reservationCalendarSource, /Try another day or reset the active filters to reopen the schedule\./);
});

test("mobile admin drawer includes close and escape affordances", () => {
  const source = readSource("app/admin/layout.tsx");

  assert.match(source, /aria-label=\"Close navigation menu\"/);
  assert.match(source, /event.key === \"Escape\"/);
  assert.match(source, /document.body.style.overflow = \"hidden\"/);
});

test("floor map waits for an explicit table selection", () => {
  const source = readSource("app/admin/tables/components/FloorMap.tsx");

  assert.match(source, /selectedTableId === null \? null : tables.find\(\(table\) => table.id === selectedTableId\) \?\? null/);
  assert.match(source, /Select a table to inspect it/);
  assert.doesNotMatch(source, /\?\? tables\[0\] \?\? null/);
});

test("admin surfaces avoid developer-facing implementation jargon", () => {
  const dashboardSource = readSource("app/admin/page.tsx");
  const checkoutSource = readSource("app/admin/checkout/page.tsx");
  const tablesPageSource = readSource("app/admin/tables/page.tsx");
  const floorMapSource = readSource("app/admin/tables/components/FloorMap.tsx");
  const tableManagementSource = readSource("app/admin/tables/components/TableManagement.tsx");
  const tableEditorSource = readSource("app/admin/tables/components/TableEditorModal.tsx");

  assert.match(dashboardSource, /Confirm that the seeded sample data is ready/);
  assert.doesNotMatch(dashboardSource, /POST `\/api\/seed`/);
  assert.match(checkoutSource, /Filter the checkout ledger by table session or game/);
  assert.doesNotMatch(checkoutSource, /app\/api\/checkout\/route\.ts/);
  assert.match(tablesPageSource, /This only works when the table has no active sessions, reservations, or historical activity\./);
  assert.match(floorMapSource, /Review the saved floor layout, current parties, and the next best action for each table\./);
  assert.doesNotMatch(floorMapSource, /stored `x_position`, `y_position`, and `shape`/);
  assert.doesNotMatch(tableManagementSource, /app\/api\/tables\/\[id\]\/route\.ts/);
  assert.match(tableEditorSource, /Use the X and Y fields to spread tables across the floor-plan canvas/);
});

test("check-in modal caps guest count to the selected table capacity", () => {
  const source = readSource("app/admin/tables/components/CheckInModal.tsx");

  assert.match(source, /const clampPartySize = \(value: number, max = maxPartySize\) => Math.min\(Math.max\(value, 1\), max\);/);
  assert.match(source, /party_size: clampPartySize\(current\.party_size, nextTable\?\.capacity \?\? current\.party_size\)/);
  assert.match(source, /Guest count is capped to match the selected table\./);
  assert.match(source, /Guest count is capped at \$\{maxPartySize\} for \$\{selectedTable\?\.name \?\? \"this table\"\}\./);
});
