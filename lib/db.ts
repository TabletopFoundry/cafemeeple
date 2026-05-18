import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "cafemeeple.db");

type CountRow = { count: number };
type TableInfoRow = { name: string };

const KNOWN_TABLES = new Set([
  "games",
  "sessions",
  "tables",
  "reservations",
  "events",
  "rsvps",
  "game_checkouts",
]);

const globalForDb = globalThis as typeof globalThis & {
  __cafemeeple_db?: Database.Database;
  __cafemeeple_seed_checked?: boolean;
};

function shouldAutoSeed() {
  return process.env.NODE_ENV !== "production";
}

export function getDb(dbPath?: string): Database.Database {
  if (!globalForDb.__cafemeeple_db) {
    globalForDb.__cafemeeple_db = new Database(dbPath ?? DB_PATH);
    globalForDb.__cafemeeple_db.pragma("journal_mode = WAL");
    globalForDb.__cafemeeple_db.pragma("foreign_keys = ON");
    initializeSchema(globalForDb.__cafemeeple_db);
  }

  if (!globalForDb.__cafemeeple_seed_checked) {
    if (shouldAutoSeed()) {
      ensureSeedData(globalForDb.__cafemeeple_db);
    }
    globalForDb.__cafemeeple_seed_checked = true;
  }

  return globalForDb.__cafemeeple_db;
}

function initializeSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      min_players INTEGER NOT NULL DEFAULT 1,
      max_players INTEGER NOT NULL DEFAULT 4,
      play_time_minutes INTEGER NOT NULL DEFAULT 30,
      complexity REAL NOT NULL DEFAULT 2.5,
      category TEXT NOT NULL DEFAULT 'Strategy',
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      bgg_id TEXT,
      copies_total INTEGER NOT NULL DEFAULT 1,
      copies_available INTEGER NOT NULL DEFAULT 1,
      condition TEXT NOT NULL DEFAULT 'Good',
      condition_score INTEGER NOT NULL DEFAULT 4,
      last_inspected_at TEXT NOT NULL DEFAULT (datetime('now')),
      replacement_threshold INTEGER NOT NULL DEFAULT 12,
      needs_replacement INTEGER NOT NULL DEFAULT 0,
      shelf_location TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      capacity INTEGER NOT NULL DEFAULT 4,
      section TEXT NOT NULL DEFAULT 'Main Floor',
      status TEXT NOT NULL DEFAULT 'available',
      x_position REAL NOT NULL DEFAULT 0,
      y_position REAL NOT NULL DEFAULT 0,
      shape TEXT NOT NULL DEFAULT 'rectangle',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      party_name TEXT NOT NULL DEFAULT 'Walk-in',
      party_size INTEGER NOT NULL DEFAULT 2,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      rate_type TEXT NOT NULL DEFAULT 'per_person',
      cover_charge_per_person REAL NOT NULL DEFAULT 5.00,
      total_charge REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );

    CREATE TABLE IF NOT EXISTS game_checkouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      checked_out_at TEXT NOT NULL DEFAULT (datetime('now')),
      returned_at TEXT,
      return_condition TEXT,
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (game_id) REFERENCES games(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL DEFAULT '',
      guest_phone TEXT NOT NULL DEFAULT '',
      party_size INTEGER NOT NULL DEFAULT 2,
      table_id INTEGER,
      reservation_date TEXT NOT NULL,
      reservation_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 120,
      status TEXT NOT NULL DEFAULT 'confirmed',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      event_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 20,
      rsvp_count INTEGER NOT NULL DEFAULT 0,
      event_type TEXT NOT NULL DEFAULT 'Game Night',
      status TEXT NOT NULL DEFAULT 'upcoming',
      image_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL DEFAULT '',
      party_size INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_table_id ON sessions(table_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_game_checkouts_session ON game_checkouts(session_id);
    CREATE INDEX IF NOT EXISTS idx_game_checkouts_game ON game_checkouts(game_id);
    CREATE INDEX IF NOT EXISTS idx_game_checkouts_checked_out_at ON game_checkouts(checked_out_at);
    CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
    CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id);
  `);

  addColumnIfMissing(database, "games", "condition_score");
  addColumnIfMissing(database, "games", "last_inspected_at");
  addColumnIfMissing(database, "games", "replacement_threshold");
  addColumnIfMissing(database, "sessions", "rate_type");

  database.exec(`
    UPDATE games
    SET condition_score = CASE
      WHEN condition = 'Excellent' THEN 5
      WHEN condition = 'Good' THEN 4
      WHEN condition = 'Fair' THEN 3
      WHEN condition = 'Worn' THEN 2
      WHEN condition = 'Needs Replacement' THEN 1
      ELSE condition_score
    END
    WHERE condition_score IS NULL OR condition_score = 0;

    UPDATE games
    SET replacement_threshold = 12
    WHERE replacement_threshold IS NULL OR replacement_threshold = 0;

    UPDATE games
    SET last_inspected_at = COALESCE(last_inspected_at, updated_at, datetime('now'));

    UPDATE sessions
    SET rate_type = COALESCE(rate_type, 'per_person');
  `);
}

/** Allowlist of known column definitions used by schema migrations. */
const KNOWN_COLUMN_DEFINITIONS: Record<string, string> = {
  condition_score: "INTEGER NOT NULL DEFAULT 4",
  last_inspected_at: "TEXT",
  replacement_threshold: "INTEGER NOT NULL DEFAULT 12",
  rate_type: "TEXT NOT NULL DEFAULT 'per_person'",
};

function addColumnIfMissing(
  database: Database.Database,
  tableName: string,
  columnName: string,
) {
  if (!KNOWN_TABLES.has(tableName)) {
    throw new Error(`Unknown table: ${tableName}`);
  }
  if (!/^[a-z_]+$/.test(columnName)) {
    throw new Error(`Invalid column name: ${columnName}`);
  }
  const definition = KNOWN_COLUMN_DEFINITIONS[columnName];
  if (!definition) {
    throw new Error(`Unknown column definition for: ${columnName}`);
  }
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all() as TableInfoRow[];
  if (!columns.some((column) => column.name === columnName)) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function ensureSeedData(database: Database.Database) {
  const hasExistingData = Array.from(KNOWN_TABLES).some((tableName) => {
    const row = database.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as CountRow;
    return row.count > 0;
  });

  if (!hasExistingData) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { seedDatabase } = require("./seed") as typeof import("./seed");
    seedDatabase(database);
  }
}
