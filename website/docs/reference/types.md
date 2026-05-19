---
id: types
title: Domain types
sidebar_label: Types
sidebar_position: 4
---

# Domain types

All TypeScript types live in [`lib/types.ts`](https://github.com/TabletopFoundry/cafemeeple/blob/main/lib/types.ts). Union types are **derived** from the constant arrays in `lib/constants.ts` so a value is defined in exactly one place.

## Status & enum unions

```ts
export type GameCondition       = (typeof VALID_GAME_CONDITIONS)[number];
export type TableStatus         = (typeof VALID_TABLE_STATUSES)[number];
export type SessionStatus       = (typeof VALID_SESSION_STATUSES)[number];
export type RateType            = (typeof VALID_RATE_TYPES)[number];
export type ReservationStatus   = (typeof VALID_RESERVATION_STATUSES)[number];
export type EventStatus         = (typeof VALID_EVENT_STATUSES)[number];
export type EventType           = (typeof VALID_EVENT_TYPES)[number];
export type TableShape          = (typeof VALID_TABLE_SHAPES)[number];
export type GameCategory        = (typeof GAME_CATEGORIES)[number];
export type RsvpStatus          = 'confirmed' | 'cancelled' | 'waitlisted';
export type AlertSeverity       = 'info' | 'warning' | 'critical';
export type AlertType           = 'replacement' | 'inventory' | 'reservations' | 'capacity' | 'maintenance';
```

## Core entity interfaces

```ts
export interface Game {
  id: number;
  title: string;
  min_players: number;
  max_players: number;
  play_time_minutes: number;
  complexity: number;
  category: string;
  description: string;
  image_url: string;
  copies_total: number;
  copies_available: number;
  condition: GameCondition;
  condition_score: number;
  shelf_location: string;
  last_inspected_at: string;
  replacement_threshold: number;
  needs_replacement: number;
}

export interface Table {
  id: number;
  name: string;
  section: string;
  capacity: number;
  shape: TableShape;
  status: TableStatus;
}

export interface Session {
  id: number;
  table_id: number;
  party_size: number;
  rate_type: RateType;
  rate_amount: number;
  guest_name: string | null;
  started_at: string;
  ended_at: string | null;
  total_amount: number | null;
  status: SessionStatus;
}

export interface GameCheckout {
  id: number;
  session_id: number;
  game_id: number;
  checked_out_at: string;
  returned_at: string | null;
  return_condition: GameCondition | null;
}

export interface Reservation {
  id: number;
  guest_name: string;
  party_size: number;
  table_id: number | null;
  starts_at: string;
  duration_min: number;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: ReservationStatus;
}

export interface Event {
  id: number;
  name: string;
  event_type: EventType;
  description: string;
  starts_at: string;
  duration_min: number;
  capacity: number | null;
  status: EventStatus;
}

export interface Rsvp {
  id: number;
  event_id: number;
  guest_name: string;
  party_size: number;
  email: string | null;
  status: RsvpStatus;
}
```

## View-specific subsets

Instead of inventing parallel types for create/update payloads, the codebase reuses the canonical interfaces with `Pick<>` and `Omit<>`:

```ts
// Create payload — server fills in id, started_at, status
export type NewSession = Omit<Session, 'id' | 'started_at' | 'ended_at' | 'total_amount' | 'status'>;

// Table card view — only what the floor plan needs
export type TableCard = Pick<Table, 'id' | 'name' | 'capacity' | 'shape' | 'status'>;
```

Following this convention keeps types DRY and prevents "shadow types" from drifting.
