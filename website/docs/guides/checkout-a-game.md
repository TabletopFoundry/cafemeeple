---
id: checkout-a-game
title: Check out a game
sidebar_label: Check out a game
sidebar_position: 2
---

# Check out a game

A game checkout links a **game** to an **active session**. It is rejected if no copies are on the shelf.

## Through the UI

1. Open `/admin/checkout`.
2. Pick an active session from the dropdown.
3. Search the library by title or category.
4. Click **Checkout** next to the game.

## Through the API

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": 142,
    "game_id": 17
  }'
```

Behind the scenes, this runs as a single SQLite transaction:

```sql
BEGIN;
  -- Refuse if no copies available
  UPDATE games
     SET copies_available = copies_available - 1
   WHERE id = ?
     AND copies_available > 0;
  -- Only insert if the UPDATE actually changed a row
  INSERT INTO game_checkouts (session_id, game_id, checked_out_at)
       VALUES (?, ?, datetime('now'));
COMMIT;
```

If the `UPDATE` matched zero rows (no copies), the route returns `409 Conflict` and the `INSERT` is rolled back.

## Returning the game

```bash
curl -X POST http://localhost:3000/api/checkout/871/return \
  -H "Content-Type: application/json" \
  -d '{"return_condition": "Good"}'
```

This:

1. Stamps `returned_at`.
2. Updates the game's `condition`, `condition_score`, and `last_inspected_at`.
3. Increments `copies_available`.
4. Sets `needs_replacement = 1` if the new score drops below the floor.

## Edge cases

- **Returning a returned checkout** → `409 Conflict`. Returns are not idempotent on purpose; staff would lose the most recent condition rating otherwise.
- **Closing a session with outstanding checkouts** → allowed, but the dashboard alerts panel flags it under "Unreturned games".

## See also

- [Games concept](../concepts/games)
- [Guide · Flag games for replacement](./flag-replacements)
