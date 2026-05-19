---
id: intro
title: Welcome to CaféMeeple
sidebar_position: 1
slug: /
---

# Welcome to CaféMeeple

**CaféMeeple** is an open-source management platform built specifically for board game cafés. It bundles the five things every café actually needs — a game library, a live table floor plan, reservations, events, and a revenue dashboard — into one Next.js app that runs on a laptop, a Raspberry Pi, or a $5/month VPS.

It is **not** a generic point-of-sale, restaurant CRM, or booking widget retrofitted to your business. Every screen and every database column exists because a real board game café asked for it.

## Who this is for

- **Café owners** who outgrew spreadsheets but refuse to pay $200/month for SaaS that doesn't understand cover charges or game condition tracking.
- **Operators** who want to give staff a fast, focused tool that handles a Saturday-night rush without crashing.
- **Developers** who want a clean, typed reference implementation of a small but complete SaaS — Next.js 16, React 19, TypeScript, SQLite, REST.

## What you can do in five minutes

After [installation](./getting-started/installation), you get a fully seeded café with **171 games**, **26 tables**, **46 reservations**, and **18 events** ready to explore. Start the dev server and you can:

- Check a party into a table and watch their cover charge tick up.
- Hand them a game from the library; return it with a condition note.
- Confirm tomorrow's reservations from the calendar view.
- See which games earned their keep this week on the dashboard.

## Where to go next

- [Install and run](./getting-started/installation) — under 5 minutes from `git clone` to localhost.
- [Take the guided tour](./getting-started/first-tour) — every screen, what it does, why it exists.
- [Core concepts](./concepts/overview) — the mental model: games, tables, sessions, checkouts.
- [API reference](./reference/api) — every endpoint, every field.
- [Why CaféMeeple?](./why) — how it compares to Square, OpenTable, and a Google Sheet.
