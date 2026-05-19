---
id: check-in-a-party
title: Check in a party
sidebar_label: Check in a party
sidebar_position: 1
---

# Check in a party

This is the most common workflow on a busy night. Two ways to do it: through the UI and through the API.

## Through the UI

1. Open `/admin/tables`.
2. Click an `available` table card.
3. Fill in the modal: guest name, party size, rate type, rate amount.
4. Hit **Check in**.

The card flips to `occupied` and a running elapsed timer + live charge appears.

## Through the API

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 4,
    "party_size": 2,
    "rate_type": "per_person",
    "rate_amount": 5.00,
    "guest_name": "Avery & Sam"
  }'
```

A successful response returns the created session:

```json
{
  "id": 142,
  "table_id": 4,
  "party_size": 2,
  "rate_type": "per_person",
  "rate_amount": 5.00,
  "guest_name": "Avery & Sam",
  "started_at": "2025-05-18T18:22:11.000Z",
  "ended_at": null,
  "status": "active",
  "total_amount": null
}
```

## Common failures

| Status | Meaning                                            | Fix                                            |
| ------ | -------------------------------------------------- | ---------------------------------------------- |
| 400    | Missing `table_id`, `party_size`, or `rate_*`      | Re-check the request body                      |
| 409    | Table is already `occupied` or in `maintenance`    | End the existing session first                 |
| 422    | `party_size > table.capacity`                      | Pick a bigger table or split the party         |

## Ending the session

When the party leaves:

```bash
curl -X PATCH http://localhost:3000/api/sessions/142 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

The server stamps `ended_at = now()`, computes `total_amount` from the elapsed time + rate, and marks the table `available`. The amount in the response is the receipt total.

## See also

- [Cover charges](../concepts/cover-charges)
- [Guide · Check out a game](./checkout-a-game)
