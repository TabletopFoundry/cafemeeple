---
id: flag-replacements
title: Flag games for replacement
sidebar_label: Flag replacements
sidebar_position: 4
---

# Flag games for replacement

Games wear out. CaféMeeple makes the wear visible.

## Automatic flagging

Every time a game is returned, the staff member records a condition. If the new condition score drops below the threshold defined in [`lib/game-utils.ts`](https://github.com/TabletopFoundry/cafemeeple/blob/main/lib/game-utils.ts), the row gets `needs_replacement = 1`.

The dashboard's **Replacements** alert is populated by:

```sql
SELECT id, title, condition, last_inspected_at
  FROM games
 WHERE needs_replacement = 1
 ORDER BY last_inspected_at DESC;
```

## Manual flagging

You don't have to wait for the algorithm. Patch the game directly:

```bash
curl -X PATCH http://localhost:3000/api/games/17 \
  -H "Content-Type: application/json" \
  -d '{"needs_replacement": 1, "condition": "Worn"}'
```

The Games screen has a "Flag for replacement" action on every row that does the same thing.

## Replacement threshold review

`replacement_threshold` (in months) is a soft signal — staff are reminded to inspect games that haven't been looked at in that long. Combine it with the condition score for a robust policy:

```sql
SELECT id, title
  FROM games
 WHERE date(last_inspected_at) <= date('now', '-' || replacement_threshold || ' months')
    OR condition_score <= 2;
```

## After replacement

Once a new copy is on the shelf:

```bash
curl -X PATCH http://localhost:3000/api/games/17 \
  -H "Content-Type: application/json" \
  -d '{
    "needs_replacement": 0,
    "condition": "Excellent",
    "last_inspected_at": "2025-05-18T10:00:00Z"
  }'
```

## See also

- [Games concept](../concepts/games)
