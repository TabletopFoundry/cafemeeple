/**
 * Application-wide constants.
 *
 * Centralises magic strings that appear in both API routes and UI components.
 * Import from here instead of hard-coding values to keep the codebase DRY.
 *
 * @module constants
 */

// ---------------------------------------------------------------------------
// Event enums
// ---------------------------------------------------------------------------

/** Allowed event type categories. */
export const VALID_EVENT_TYPES = ["Game Night", "Tournament", "Workshop", "Social", "Family Event", "Special"] as const;

/** Allowed event lifecycle statuses. */
export const VALID_EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;

// ---------------------------------------------------------------------------
// Reservation enums
// ---------------------------------------------------------------------------

/** Allowed reservation lifecycle statuses. */
export const VALID_RESERVATION_STATUSES = ["confirmed", "pending", "cancelled", "no-show", "completed"] as const;

// ---------------------------------------------------------------------------
// Session / table enums
// ---------------------------------------------------------------------------

/** Allowed session statuses. */
export const VALID_SESSION_STATUSES = ["active", "completed"] as const;

/** Allowed table statuses. */
export const VALID_TABLE_STATUSES = ["available", "occupied", "reserved", "maintenance"] as const;

/** Billing rate types for sessions. */
export const VALID_RATE_TYPES = ["per_person", "per_table"] as const;

// ---------------------------------------------------------------------------
// Game enums
// ---------------------------------------------------------------------------

/** Allowed game condition labels, ordered best → worst. */
export const VALID_GAME_CONDITIONS = ["Excellent", "Good", "Fair", "Worn", "Needs Replacement"] as const;

/** Top-level game categories used in the library. */
export const GAME_CATEGORIES = [
  "Strategy",
  "Party",
  "Cooperative",
  "Family",
  "Card Game",
  "Deck Building",
  "Worker Placement",
  "Area Control",
  "Dice",
  "Trivia",
  "Dexterity",
  "Deduction",
  "Engine Building",
  "Abstract",
  "Wargame",
  "RPG",
  "Thematic",
  "Word Game",
  "Other",
] as const;

// ---------------------------------------------------------------------------
// Table / floor-plan sections
// ---------------------------------------------------------------------------

/** Allowed table shapes for floor-plan rendering. */
export const VALID_TABLE_SHAPES = ["rectangle", "circle", "square"] as const;

/** Named sections of the café floor for table grouping. */
export const TABLE_SECTIONS = [
  "Main Floor",
  "Quiet Corner",
  "Window Seats",
  "Back Room",
  "Patio",
  "Private Room",
  "Balcony",
  "Mezzanine",
] as const;

// ---------------------------------------------------------------------------
// Input limits
// ---------------------------------------------------------------------------

/** Maximum text lengths accepted by the API for user-managed content. */
export const MAX_TEXT_LENGTHS = {
  gameTitle: 120,
  gameCategory: 60,
  gameDescription: 4000,
  imageUrl: 500,
  shelfLocation: 80,
  tableName: 80,
  partyName: 120,
  guestName: 120,
  guestEmail: 254,
  guestPhone: 40,
  reservationNotes: 1000,
  eventTitle: 140,
  eventDescription: 2000,
  checkoutNotes: 1000,
} as const;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** Default cover charge per person (in café currency). */
export const DEFAULT_COVER_CHARGE = 5.0;

/** Default reservation duration in minutes. */
export const DEFAULT_RESERVATION_DURATION = 120;

/** Default event capacity. */
export const DEFAULT_EVENT_CAPACITY = 20;
