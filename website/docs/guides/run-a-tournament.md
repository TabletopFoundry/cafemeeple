---
id: run-a-tournament
title: Run a tournament
sidebar_label: Run a tournament
sidebar_position: 3
---

# Run a tournament

A tournament is just an `Event` with `event_type = 'Tournament'` and a hard capacity. Here is the full workflow.

## 1. Create the event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Catan Showdown",
    "event_type": "Tournament",
    "starts_at": "2025-06-14T18:00:00Z",
    "duration_min": 240,
    "capacity": 16,
    "description": "Single-elimination, 4-player tables, points victory only.",
    "status": "upcoming"
  }'
```

## 2. Take RSVPs

```bash
curl -X POST http://localhost:3000/api/events/42/rsvps \
  -H "Content-Type: application/json" \
  -d '{"guest_name": "Avery Liu", "party_size": 1, "email": "avery@example.com"}'
```

Once you hit 16 confirmed RSVPs, the next one is automatically `waitlisted`.

## 3. Reserve the tables

Tournaments span multiple tables for the same time window. Create one reservation per table:

```bash
for table in 5 6 7 8; do
  curl -X POST http://localhost:3000/api/reservations \
    -H "Content-Type: application/json" \
    -d "{
      \"guest_name\": \"Spring Catan Showdown\",
      \"table_id\": $table,
      \"party_size\": 4,
      \"starts_at\": \"2025-06-14T18:00:00Z\",
      \"duration_min\": 240,
      \"status\": \"confirmed\"
    }"
done
```

## 4. The night of

Mark the event `ongoing` so the dashboard reflects it:

```bash
curl -X PATCH http://localhost:3000/api/events/42 \
  -H "Content-Type: application/json" \
  -d '{"status": "ongoing"}'
```

As players arrive, check in each table the same way you would any party ([Check in a party](./check-in-a-party)), referencing the tournament name in `guest_name`.

## 5. After the event

```bash
curl -X PATCH http://localhost:3000/api/events/42 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

No-shows can be marked individually on the RSVP rows so future invitations can take attendance reliability into account.

## See also

- [Events concept](../concepts/events)
- [API · Events](../reference/api#events)
