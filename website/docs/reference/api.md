---
id: api
title: REST API reference
sidebar_label: API
sidebar_position: 1
---

# REST API reference

All endpoints live under `/api/` and return JSON. Errors follow `{ "error": "<message>" }` with an appropriate HTTP status. Successful responses return the resource (or an array of resources) directly — no envelope.

The base URL during development is `http://localhost:3000`.

## Conventions

- **Content type** — every body is `application/json`.
- **Timestamps** — ISO 8601 in UTC.
- **IDs** — integers, auto-incrementing.
- **Errors** — `{ "error": string }`, status 4xx for client mistakes, 5xx for server bugs.
- **No auth** — the dev server has no authentication. Put it behind your own reverse-proxy / SSO in production.

## Dashboard

### `GET /api/dashboard`

Returns aggregated stats for the admin home screen.

```json
{
  "today_revenue": 245.50,
  "active_sessions": 3,
  "todays_reservations": 8,
  "upcoming_events": 2,
  "revenue_trend": [{"date": "2025-05-12", "amount": 312.00}, ...],
  "popular_games": [{"id": 17, "title": "Wingspan", "checkout_count": 14}, ...],
  "alerts": [{"type": "replacement", "severity": "warning", "message": "..."}]
}
```

## Games

| Method | Path                | Description                       |
| ------ | ------------------- | --------------------------------- |
| GET    | `/api/games`        | List, supports `?search=`, `?category=`, `?needs_replacement=1` |
| POST   | `/api/games`        | Create a game                     |
| GET    | `/api/games/:id`    | Fetch one game                    |
| PATCH  | `/api/games/:id`    | Update fields                     |
| DELETE | `/api/games/:id`    | Remove from library               |

**Create example:**

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wingspan",
    "min_players": 1,
    "max_players": 5,
    "play_time_minutes": 70,
    "complexity": 2.4,
    "category": "Engine Building",
    "copies_total": 2,
    "shelf_location": "A1",
    "condition": "Excellent"
  }'
```

## Tables

| Method | Path                | Description                       |
| ------ | ------------------- | --------------------------------- |
| GET    | `/api/tables`       | List all tables (with status)     |
| POST   | `/api/tables`       | Create a table                    |
| GET    | `/api/tables/:id`   | Fetch one table                   |
| PATCH  | `/api/tables/:id`   | Update name/section/capacity/status/shape |
| DELETE | `/api/tables/:id`   | Remove (fails if active sessions exist)   |

## Sessions

| Method | Path                  | Description                         |
| ------ | --------------------- | ----------------------------------- |
| GET    | `/api/sessions`       | List. Supports `?status=active`     |
| POST   | `/api/sessions`       | **Check in** a party                |
| GET    | `/api/sessions/:id`   | Fetch one session                   |
| PATCH  | `/api/sessions/:id`   | Update — set `status: "completed"` to **check out** |
| DELETE | `/api/sessions/:id`   | Hard-delete (rare; prefer status updates) |

**Check in:**

```json
POST /api/sessions
{
  "table_id": 4,
  "party_size": 2,
  "rate_type": "per_person",
  "rate_amount": 5.00,
  "guest_name": "Avery & Sam"
}
```

**Check out:**

```json
PATCH /api/sessions/142
{ "status": "completed" }
```

## Checkout (games to sessions)

| Method | Path                                | Description                            |
| ------ | ----------------------------------- | -------------------------------------- |
| GET    | `/api/checkout`                     | List checkouts, supports `?session_id=`, `?game_id=`, `?returned=0` |
| POST   | `/api/checkout`                     | Check a game out to an active session  |
| POST   | `/api/checkout/:id/return`          | Return a game; logs condition          |

**Checkout:**

```json
POST /api/checkout
{ "session_id": 142, "game_id": 17 }
```

**Return:**

```json
POST /api/checkout/871/return
{ "return_condition": "Good" }
```

## Reservations

| Method | Path                       | Description                                                       |
| ------ | -------------------------- | ----------------------------------------------------------------- |
| GET    | `/api/reservations`        | List. Supports `?from=`, `?to=`, `?status=`                       |
| POST   | `/api/reservations`        | Create                                                            |
| GET    | `/api/reservations/:id`    | Fetch one                                                         |
| PATCH  | `/api/reservations/:id`    | Update — typical use is `status` transitions                      |
| DELETE | `/api/reservations/:id`    | Hard-delete                                                       |

## Events

| Method | Path                                       | Description                       |
| ------ | ------------------------------------------ | --------------------------------- |
| GET    | `/api/events`                              | List. Supports `?status=`         |
| POST   | `/api/events`                              | Create                            |
| GET    | `/api/events/:id`                          | Fetch one (includes RSVP counts)  |
| PATCH  | `/api/events/:id`                          | Update                            |
| DELETE | `/api/events/:id`                          | Remove                            |
| GET    | `/api/events/:id/rsvps`                    | List RSVPs                        |
| POST   | `/api/events/:id/rsvps`                    | Add an RSVP                       |
| PATCH  | `/api/events/:id/rsvps/:rsvpId`            | Update an RSVP                    |
| DELETE | `/api/events/:id/rsvps/:rsvpId`            | Remove an RSVP                    |

## Seed

| Method | Path           | Description                                              |
| ------ | -------------- | -------------------------------------------------------- |
| GET    | `/api/seed`    | Check seed status — returns counts                       |
| POST   | `/api/seed`    | Run the seed (no-op if data exists; refuses in prod)     |

## Error catalogue

| Status | When                                                  |
| ------ | ----------------------------------------------------- |
| 400    | Missing or malformed required field                   |
| 404    | Resource not found                                    |
| 409    | Conflict — e.g. table already occupied, no copies     |
| 422    | Validation failed — e.g. party_size > capacity        |
| 500    | Unhandled server error (file a bug)                   |
