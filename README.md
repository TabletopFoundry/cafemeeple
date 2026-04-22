# ☕ CaféMeeple — Board Game Café Management SaaS

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-Private-red)]()

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

The database is automatically created and seeded with sample data on first load:
- 100+ board games across multiple categories
- 15 themed tables across 5 sections
- Sample reservations, events, and RSVPs
- 30 days of mock session/checkout history
- 4 active sessions for today

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
└── seed.ts                     # Seed data (100+ games, tables, etc.)
```

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
