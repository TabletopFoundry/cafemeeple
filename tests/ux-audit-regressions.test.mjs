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

test("landing page copy matches the current admin demo scope", () => {
  const source = readSource("app/page.tsx");

  assert.match(source, /title: \"Reservations Management\"/);
  assert.match(source, /Open Dashboard →/);
  assert.match(source, /Explore Admin Demo →/);
  assert.doesNotMatch(source, /Reservations & Waitlist/);
  assert.doesNotMatch(source, /BGG integration/);
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

  assert.match(eventsPageSource, /const \[loadingRsvps, setLoadingRsvps\] = useState\(false\);/);
  assert.match(eventsPageSource, /setRsvps\(\[\]\);/);
  assert.match(rsvpModalSource, /Loading attendee totals\.\.\./);
  assert.match(rsvpModalSource, /Loading RSVPs\.\.\./);
  assert.match(rsvpModalSource, /This event is currently full\./);
});

test("mobile admin drawer includes close and escape affordances", () => {
  const source = readSource("app/admin/layout.tsx");

  assert.match(source, /aria-label=\"Close navigation menu\"/);
  assert.match(source, /event.key === \"Escape\"/);
  assert.match(source, /document.body.style.overflow = \"hidden\"/);
});

test("check-in modal caps guest count to the selected table capacity", () => {
  const source = readSource("app/admin/tables/components/CheckInModal.tsx");

  assert.match(source, /const clampPartySize = \(value: number, max = maxPartySize\) => Math.min\(Math.max\(value, 1\), max\);/);
  assert.match(source, /party_size: clampPartySize\(current\.party_size, nextTable\?\.capacity \?\? current\.party_size\)/);
  assert.match(source, /Guest count is capped to match the selected table\./);
  assert.match(source, /Guest count is capped at \$\{maxPartySize\} for \$\{selectedTable\?\.name \?\? \"this table\"\}\./);
});
