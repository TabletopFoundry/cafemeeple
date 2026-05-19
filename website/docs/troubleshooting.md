---
id: troubleshooting
title: Troubleshooting & FAQ
sidebar_label: Troubleshooting
sidebar_position: 11
---

# Troubleshooting & FAQ

## Common errors

### `Error: SQLITE_BUSY: database is locked`

Another process has the database open in write mode. Typically:

- A second `npm run dev` is running. Kill the duplicate.
- An external SQLite tool (DB Browser, DataGrip) has a write transaction open. Close it or set the tool to read-only.

### `Cannot find module 'better-sqlite3'` after `npm install`

`better-sqlite3` is a native module and needs to compile against your Node version. Rebuild it:

```bash
npm rebuild better-sqlite3
```

If that fails, ensure you have a working C++ toolchain (`xcode-select --install` on macOS, `build-essential` on Debian/Ubuntu).

### Dashboard shows zeros / empty graphs

The seed only runs on an **empty** database. If you see this on a fresh checkout, it usually means a previous run already created the file with no data because of a startup error. Reset it:

```bash
rm -f cafemeeple.db cafemeeple.db-shm cafemeeple.db-wal
npm run dev
```

### HTTP 409 when checking in a table

The table is already `occupied`, `reserved`, or in `maintenance`. List active sessions to find the existing one:

```bash
curl 'http://localhost:3000/api/sessions?status=active' | jq
```

End that session, then retry.

### HTTP 409 when checking out a game

No copies are available. Either return an outstanding copy first, or update `copies_total` and `copies_available` if the inventory was wrong.

### TypeScript reports `Type 'string' is not assignable to type 'GameCondition'`

A hard-coded string literal must be one of `VALID_GAME_CONDITIONS`. Use the constant or fix the literal — don't cast.

## FAQ

### Can I deploy this to production today?

Yes — with caveats. The default has **no authentication**. Run it behind a reverse proxy with basic auth, OAuth, or your IdP of choice. The SQLite database is a single file; back it up with rsync or borg.

### Will SQLite handle my café's traffic?

Almost certainly. CaféMeeple is read-heavy with bursty writes (a check-in, a checkout). SQLite easily handles thousands of requests per second on commodity hardware. A single café will never approach that.

### How do I back up the database?

Stop the server (or use SQLite's online backup API). Copy `cafemeeple.db` somewhere safe. Restore by copying it back. That's the whole procedure.

### Can I run two locations from one instance?

Not as shipped — there is no concept of a `location_id` on tables, sessions or reservations. Adding it is straightforward (a column on each table, a filter in each query) but it is a fork, not a config.

### What about multi-currency?

Out of scope. Pick a currency and stick with it. Display formatting lives in `lib/date-utils.ts` and friends — change it once.

### Can I use Postgres instead of SQLite?

Yes. Replace `better-sqlite3` with `pg`, port the schema in `lib/db.ts`, and adjust the parameterised query syntax (`?` → `$1`). All API routes use prepared statements, so the change is mechanical.

### Is there a hosted version?

Not yet. Watch the [GitHub repo](https://github.com/TabletopFoundry/cafemeeple) for announcements.

### How do I report a bug?

[Open an issue](https://github.com/TabletopFoundry/cafemeeple/issues) with steps to reproduce, expected behaviour, actual behaviour, and your Node version. Bonus points for a failing curl command.
