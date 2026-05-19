---
id: cover-charges
title: Cover charges
sidebar_label: Cover charges
sidebar_position: 4
---

# Cover charges

A cover charge is the fee a board game café charges for table time — distinct from food and drinks. CaféMeeple supports two billing models out of the box.

## The two rate types

### `per_person`

Each guest pays `rate_amount` per hour (or per session, depending on configuration). Solo and pair traffic scales naturally.

```
total = rate_amount × hours × party_size
```

### `per_table`

The whole table pays a flat hourly rate, regardless of party size. Better for groups who'd otherwise be discouraged by per-head pricing.

```
total = rate_amount × hours
```

## Worked example

A party of 4 sits down at 18:00 with a `per_person` rate of `$5.00/hr`. They leave at 20:30.

| Field            | Value     |
| ---------------- | --------- |
| `party_size`     | 4         |
| `rate_type`      | per_person|
| `rate_amount`    | 5.00      |
| `duration_hours` | 2.5       |
| **Total**        | **$50.00** |

If the same party were billed `per_table` at the same `$5.00/hr` rate, the total would be `$12.50` — a deliberate design choice you tune per café.

## Live totals

The Tables screen polls each active session and renders the *current* charge, using:

```ts
const hours = (Date.now() - startedAt) / 3_600_000;
const multiplier = rateType === 'per_person' ? partySize : 1;
const liveTotal = rateAmount * hours * multiplier;
```

Persisted `total_amount` is **only written on check-out**. The live number is for staff guidance; the receipt number is authoritative.

## Why no minimums or rounding?

Out of the box, CaféMeeple bills to the millisecond. Real cafés round up to the nearest 15 minutes or charge a minimum first hour — both of those policies are one-line additions in the check-out handler. The codebase intentionally avoids encoding policy that varies by location.

## Where to customise

- **Default rate** — `DEFAULT_COVER_RATE` in [`lib/constants.ts`](https://github.com/TabletopFoundry/cafemeeple/blob/main/lib/constants.ts).
- **Computation** — the `total_amount` calculation in `PATCH /api/sessions/:id`.
- **Display formatting** — `formatElapsed` in [`lib/date-utils.ts`](https://github.com/TabletopFoundry/cafemeeple/blob/main/lib/date-utils.ts).

## See also

- [Tables & sessions](./tables-and-sessions)
- [API · Sessions](../reference/api#sessions)
