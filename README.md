# ☕ CaféMeeple — Board Game Café Management SaaS

A purpose-built management platform for board game cafés. Manage your game library, tables, cover charges, reservations, events, and analytics in one place.

## Features

- **Landing Page** — Marketing page for café owners with pricing, features, and testimonials
- **Admin Dashboard** — Today's stats, revenue charts (recharts), popular games, alerts
- **Game Library** — 100+ seeded board games, search/filter, condition tracking, add/edit/remove, replacement flagging
- **Tables & Sessions** — Visual table map, check-in/check-out, active sessions with running totals, cover charges
- **Game Checkout** — Assign games to table sessions, return flow with condition logging, checkout history
- **Reservations** — Calendar and list views, create/edit reservations, status management (confirm, no-show, cancel)
- **Events & RSVPs** — Create events, RSVP tracking with capacity management, event types

## Tech Stack

- **Framework**: Next.js 16 with App Router (TypeScript)
- **Styling**: Tailwind CSS 4
- **Database**: SQLite via better-sqlite3
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

The database is automatically created and seeded with sample data on first load:
- 100+ board games across multiple categories
- 15 themed tables across 5 sections
- Sample reservations, events, and RSVPs
- 30 days of mock session/checkout history
- 4 active sessions for today

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```
app/
├── page.tsx                    # Landing/marketing page
├── layout.tsx                  # Root layout
├── globals.css                 # Global styles (Tailwind)
├── admin/
│   ├── layout.tsx              # Admin layout with sidebar
│   ├── page.tsx                # Dashboard with stats & charts
│   ├── games/page.tsx          # Game library management
│   ├── tables/page.tsx         # Table map & session management
│   ├── checkout/page.tsx       # Game checkout system
│   ├── reservations/page.tsx   # Reservation calendar & list
│   └── events/page.tsx         # Event & RSVP management
├── api/
│   ├── dashboard/route.ts      # Dashboard stats endpoint
│   ├── seed/route.ts           # Database seeding endpoint
│   ├── games/                  # CRUD for games
│   ├── tables/                 # CRUD for tables
│   ├── sessions/               # Session management
│   ├── reservations/           # Reservation management
│   ├── events/                 # Event management
│   └── checkout/               # Game checkout/return
components/
├── Sidebar.tsx                 # Admin navigation sidebar
└── ui.tsx                      # Shared UI components
lib/
├── db.ts                       # Database initialization & schema
└── seed.ts                     # Seed data (100+ games, tables, etc.)
```

## Database

SQLite database (`cafemeeple.db`) is created automatically in the project root. It includes:

- **games** — Board game catalog with metadata and condition tracking
- **tables** — Café tables with capacity and section info
- **sessions** — Visit sessions with cover charge billing
- **game_checkouts** — Game-to-session assignment and return tracking
- **reservations** — Guest reservations with table assignment
- **events** — Café events (game nights, tournaments, etc.)
- **rsvps** — Event RSVP tracking

## License

Private — All rights reserved.
