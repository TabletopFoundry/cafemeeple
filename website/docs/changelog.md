---
id: changelog
title: Changelog
sidebar_label: Changelog
sidebar_position: 13
---

# Changelog

All notable changes to CaféMeeple are documented here. The project follows [Semantic Versioning](https://semver.org/).

## 0.1.0 — Initial public preview

**Highlights**

- Full admin dashboard with revenue chart, popular games and alerts.
- Game library with 171 seeded titles, condition scoring and replacement flagging.
- Visual table floor plan with check-in / check-out and live cover-charge totals.
- Game checkout workflow with return-condition logging.
- Reservation calendar and list views with status workflow.
- Events with capacity caps and auto-promoting waitlists.
- Documentation site (this site) covering concepts, guides, and the full REST API.

**Tech**

- Next.js 16 (App Router)
- React 19
- TypeScript 5 (strict)
- Tailwind CSS 4 (PostCSS)
- SQLite via `better-sqlite3`
- Recharts for visualisations
- Lucide React for icons

## Versioning strategy

- **Patch** (`0.1.x`) — bug fixes, doc updates, no schema changes.
- **Minor** (`0.x.0`) — additive schema changes, new endpoints, new screens.
- **Major** (`x.0.0`) — backwards-incompatible API or schema changes.

Schema changes are called out explicitly in release notes with the migration steps required. There is no automatic migration framework; see [Database · Migrations](./reference/database#migrations).
