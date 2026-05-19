---
id: configuration
title: Configuration
sidebar_label: Configuration
sidebar_position: 3
---

# Configuration

CaféMeeple is configured by **code**, not environment variables. The single source of truth is [`lib/constants.ts`](https://github.com/TabletopFoundry/cafemeeple/blob/main/lib/constants.ts). Edit it, restart, done.

## Constants you'll actually touch

| Constant                  | What it controls                                      |
| ------------------------- | ----------------------------------------------------- |
| `DEFAULT_COVER_RATE`      | Default rate amount when creating a new session       |
| `DEFAULT_RATE_TYPE`       | `per_person` or `per_table`                           |
| `DEFAULT_RESERVATION_MIN` | Default reservation duration (minutes)                |
| `TABLE_SECTIONS`          | Named sections rendered in the floor-plan view        |
| `GAME_CATEGORIES`         | The dropdown options for `category` on games          |
| `VALID_EVENT_TYPES`       | The dropdown options for `event_type` on events       |

## Adding a new game category

1. Append it to `GAME_CATEGORIES` in `lib/constants.ts`.
2. Restart `npm run dev`.
3. The new value appears in every category dropdown automatically — the union type `GameCategory` is derived from the constant.

```ts
export const GAME_CATEGORIES = [
  "Strategy",
  "Party",
  // ...
  "Solo",            // ← your new value
] as const;
```

TypeScript will refuse to compile if anywhere in the codebase has a `category` string literal that doesn't match. That's the point.

## Adding a new floor section

```ts
export const TABLE_SECTIONS = [
  "Main Floor",
  "Quiet Corner",
  // ...
  "Rooftop",         // ← your new section
] as const;
```

Existing tables continue to work; the new section becomes available when editing tables.

## Environment variables

There is **one** environment variable in the codebase:

| Variable    | Default       | Purpose                                                  |
| ----------- | ------------- | -------------------------------------------------------- |
| `NODE_ENV`  | `development` | Gates the seed: `production` disables seeding entirely.  |

Everything else (database location, port, etc.) follows Next.js defaults.

## File locations

| Path                       | What it does                                               |
| -------------------------- | ---------------------------------------------------------- |
| `lib/constants.ts`         | All enum values and tunable defaults                       |
| `lib/db.ts`                | Schema, singleton, auto-seed                               |
| `lib/seed.ts`              | Development seed data                                      |
| `lib/types.ts`             | Domain types (derived from constants)                      |
| `lib/validation.ts`        | API input validation helpers                               |
| `lib/date-utils.ts`        | Date formatting & comparison                               |
| `lib/game-utils.ts`        | Condition score mapping                                    |
| `app/api/*/route.ts`       | One file per REST resource                                 |
| `components/ui.tsx`        | Shared primitives (Badge, StatCard, LoadingSpinner)        |

## Tailwind theme

The colour palette is fixed: **violet** (primary), **emerald** (success), **amber** (warning), **blue** (info), **red** (destructive). Override in `app/globals.css` if you need different brand colours — but be aware that the dashboard charts hard-code these in a few places.
