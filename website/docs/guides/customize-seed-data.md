---
id: customize-seed-data
title: Customise the seed data
sidebar_label: Customise seed data
sidebar_position: 5
---

# Customise the seed data

The default seed is a great demo, but for production you'll want **your** library, **your** floor plan, and **your** rates.

## The shape of the seed

`lib/seed.ts` exports a single `seedDatabase(db: Database)` function. It is called once, inside `lib/db.ts`, only when the `games` table is empty.

```ts
// lib/seed.ts (abbreviated)
export function seedDatabase(db: Database) {
  if (process.env.NODE_ENV === 'production') return;

  const insertGame = db.prepare(`INSERT INTO games (...) VALUES (...)`);
  const insertTable = db.prepare(`INSERT INTO tables (...) VALUES (...)`);
  // …

  db.transaction(() => {
    for (const g of GAMES) insertGame.run(g);
    for (const t of TABLES) insertTable.run(t);
  })();
}
```

## Replacing the library

Swap the `GAMES` array for your own. A minimal entry:

```ts
{
  title: 'Wingspan',
  min_players: 1,
  max_players: 5,
  play_time_minutes: 70,
  complexity: 2.4,
  category: 'Engine Building',
  description: 'A relaxing, award-winning strategy game about birds.',
  image_url: '/games/wingspan.jpg',
  copies_total: 2,
  copies_available: 2,
  condition: 'Excellent',
  shelf_location: 'A1',
  replacement_threshold: 18,
}
```

Drop your real list in, delete `cafemeeple.db*`, restart, done.

## Importing from a CSV

If your inventory lives in a spreadsheet, convert it to JSON once and import. A small one-off script:

```ts
// scripts/import-games.ts
import {parse} from 'csv-parse/sync';
import fs from 'node:fs';
import db from '../lib/db';

const rows = parse(fs.readFileSync('inventory.csv'), {columns: true});
const stmt = db.prepare(`
  INSERT INTO games (title, category, copies_total, copies_available, condition, shelf_location)
  VALUES (@title, @category, @copies_total, @copies_total, 'Excellent', @shelf_location)
`);
db.transaction(() => rows.forEach((r) => stmt.run(r)))();
console.log(`Imported ${rows.length} games`);
```

Run with `npx tsx scripts/import-games.ts`.

## Re-seeding without losing data

The built-in seed is **all or nothing** — it only runs against an empty database. To add data without wiping, hit the API directly:

```bash
curl -X POST http://localhost:3000/api/games -H "Content-Type: application/json" -d @new-game.json
```

## See also

- [Seed data overview](../getting-started/seed-data)
- [API · Games](../reference/api#games)
