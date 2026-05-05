import { getDb } from "@/lib/db";
import { firstError, validatePositiveInt, validateNonNegativeNumber, validateEnum, validateMaxLength } from "@/lib/validation";
import { VALID_RATE_TYPES, DEFAULT_COVER_CHARGE, MAX_TEXT_LENGTHS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let query = `
      SELECT
        s.*,
        t.name as table_name,
        t.capacity as table_capacity,
        COALESCE(active_games.count, 0) as active_games,
        CASE
          WHEN s.rate_type = 'per_table' THEN s.cover_charge_per_person
          ELSE s.party_size * s.cover_charge_per_person
        END as running_total
      FROM sessions s
      JOIN tables t ON s.table_id = t.id
      LEFT JOIN (
        SELECT session_id, COUNT(*) as count
        FROM game_checkouts
        WHERE returned_at IS NULL
        GROUP BY session_id
      ) active_games ON active_games.session_id = s.id
    `;
    const params: string[] = [];

    if (status) {
      query += " WHERE s.status = ?";
      params.push(status);
    }

    query += " ORDER BY s.started_at DESC LIMIT 100";

    const sessions = db.prepare(query).all(...params);
    return Response.json(sessions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { table_id, party_name, party_size, rate_type, cover_charge_per_person } = body;

    if (!table_id) {
      return Response.json({ error: "Table ID is required" }, { status: 400 });
    }

    const validationError = firstError(
      validatePositiveInt(party_size, "party_size"),
      validateNonNegativeNumber(cover_charge_per_person, "cover_charge_per_person"),
      validateEnum(rate_type, "rate_type", VALID_RATE_TYPES),
      validateMaxLength(party_name, "party_name", MAX_TEXT_LENGTHS.partyName),
    );
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const table = db.prepare("SELECT id, capacity, status FROM tables WHERE id = ?").get(table_id) as
      | { id: number; capacity: number; status: string }
      | undefined;

    if (!table) {
      return Response.json({ error: "Table not found" }, { status: 404 });
    }

    if (table.status === "maintenance") {
      return Response.json({ error: "This table is currently under maintenance" }, { status: 400 });
    }

    if ((party_size || 0) > table.capacity) {
      return Response.json(
        { error: `Party size exceeds ${table.capacity}-seat capacity for this table.` },
        { status: 400 },
      );
    }

    const billingType: (typeof VALID_RATE_TYPES)[number] = rate_type === "per_table" ? "per_table" : "per_person";
    const sessionTx = db.transaction(() => {
      const activeSession = db
        .prepare("SELECT id FROM sessions WHERE table_id = ? AND status = 'active'")
        .get(table_id);
      if (activeSession) {
        throw new Error("TABLE_OCCUPIED");
      }

      const hasUpcomingReservation = db
        .prepare(
          `
            SELECT id
            FROM reservations
            WHERE table_id = ?
              AND reservation_date = date('now')
              AND status IN ('confirmed', 'pending')
              AND time('now', 'localtime') < time(reservation_time, '+' || duration_minutes || ' minutes')
              AND time('now', 'localtime', '+30 minutes') > time(reservation_time)
            LIMIT 1
          `,
        )
        .get(table_id);

      if (hasUpcomingReservation) {
        throw new Error("TABLE_RESERVED");
      }

      const result = db.prepare(`
        INSERT INTO sessions (table_id, party_name, party_size, rate_type, cover_charge_per_person)
        VALUES (?, ?, ?, ?, ?)
      `).run(table_id, party_name || "Walk-in", party_size || 2, billingType, cover_charge_per_person || DEFAULT_COVER_CHARGE);

      db.prepare("UPDATE tables SET status = 'occupied' WHERE id = ?").run(table_id);

      return result;
    });

    let result;
    try {
      result = sessionTx();
    } catch (txError) {
      if (txError instanceof Error && txError.message === "TABLE_OCCUPIED") {
        return Response.json({ error: "Table is already occupied" }, { status: 400 });
      }
      if (txError instanceof Error && txError.message === "TABLE_RESERVED") {
        return Response.json({ error: "This table is reserved for a guest today." }, { status: 400 });
      }
      throw txError;
    }

    const session = db.prepare(`
      SELECT
        s.*,
        t.name as table_name,
        CASE
          WHEN s.rate_type = 'per_table' THEN s.cover_charge_per_person
          ELSE s.party_size * s.cover_charge_per_person
        END as running_total,
        0 as active_games
      FROM sessions s
      JOIN tables t ON s.table_id = t.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    return Response.json(session, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
