# ☕ CaféMeeple — Board Game Café Management SaaS

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-Private-red)]()
[![Docs](https://img.shields.io/badge/docs-online-8b5cf6)](./website)

> Your café's operating system, from shelf to table.

A purpose-built management platform for board game cafés. Manage your game library, tables, cover charges, reservations, events, and analytics in one place.

---

## ✨ Features

- **🏠 Landing Page** — Marketing page for café owners with pricing, features, and testimonials
- **📊 Admin Dashboard** — Today's stats, revenue charts (recharts), popular games, alerts
- **🎲 Game Library** — 100+ seeded board games, search/filter, condition tracking, add/edit/remove, replacement flagging
- **🪑 Tables & Sessions** — Visual table map, check-in/check-out, active sessions with running totals, cover charges
- **🔄 Game Checkout** — Assign games to table sessions, return flow with condition logging, checkout history
- **📅 Reservations** — Calendar and list views, create/edit reservations, status management (confirm, no-show, cancel)
- **🎉 Events & RSVPs** — Create events, RSVP tracking with capacity management, event types

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) with App Router (TypeScript) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | [SQLite](https://sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20 LTS — see `.nvmrc`)
- **npm** 9+

### Installation

```bash
# If using nvm, switch to the correct Node version
nvm use

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

The database is automatically created and seeded with rich development data on first load:
- 171 board games covering every catalog category
- 26 floor-plan tables across all café sections
- 46 reservations with same-day holds and future bookings
- 18 events with RSVP activity, including sold-out nights
- 60 completed sessions plus 5 active tables across the last 30 days
- 126 checkout records, never-played games, and zero-session tables for edge cases

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run typecheck` | Run TypeScript type checking |

## 📁 Project Structure

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
├── Modal.tsx                   # Accessible modal with focus trap
├── Toast.tsx                   # Toast notification system
├── ErrorBoundary.tsx           # React error boundary
├── ConfirmDialog.tsx           # Confirmation dialog
└── ui.tsx                      # Shared UI components
hooks/
└── useFetch.ts                 # Generic data fetching hooks
lib/
├── db.ts                       # Database initialization & schema
├── types.ts                    # Canonical domain types
├── game-utils.ts               # Game condition utilities
└── seed.ts                     # Deterministic development seed data
```

## 🌱 Seed Data

The development seed is **deterministic**, **idempotent**, and wrapped in a **single transaction**. It only runs when the database is empty, and production seeding is blocked.

### Dataset highlights

- **Games**: 171 titles across every category, with condition scores, inspection dates, replacement thresholds, and popularity history
- **Tables**: 26 tables across Main Floor, Quiet Corner, Window Seats, Back Room, Patio, Private Room, Balcony, and Mezzanine
- **Sessions**: 60 historical sessions spanning the last 30 days plus 5 active sessions in progress
- **Reservations**: 46 reservations with confirmed, pending, completed, cancelled, and no-show examples
- **Events**: 18 events across game nights, tournaments, workshops, socials, family events, and specials
- **Checkouts**: 126 checkout records with heavy hitters, replacement candidates, and never-checked-out edge cases
- **Edge cases**: maintenance tables, reserved tables, full-capacity events, tables with zero sessions, and shelf titles that have never left the library

### Regenerating locally

If you want to replay the seed from scratch in development, remove the local SQLite files and restart the app:

```bash
rm -f cafemeeple.db cafemeeple.db-shm cafemeeple.db-wal
npm run dev
```

You can also `POST /api/seed`, but the endpoint intentionally **will not overwrite existing data**.

## 🗄 Database

SQLite database (`cafemeeple.db`) is created automatically in the project root. It includes:

| Table | Description |
|-------|-------------|
| `games` | Board game catalog with metadata and condition tracking |
| `tables` | Café tables with capacity and section info |
| `sessions` | Visit sessions with cover charge billing |
| `game_checkouts` | Game-to-session assignment and return tracking |
| `reservations` | Guest reservations with table assignment |
| `events` | Café events (game nights, tournaments, etc.) |
| `rsvps` | Event RSVP tracking |

## 📄 License

Private — All rights reserved.
