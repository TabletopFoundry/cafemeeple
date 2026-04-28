import { getDb } from "@/lib/db";
import { firstError, validatePositiveInt, validateEnum } from "@/lib/validation";
import { VALID_RESERVATION_STATUSES } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const status = url.searchParams.get("status");

    let query = "SELECT r.*, t.name as table_name FROM reservations r LEFT JOIN tables t ON r.table_id = t.id WHERE 1=1";
    const params: string[] = [];

    if (date) {
      query += " AND r.reservation_date = ?";
      params.push(date);
    }
    if (status) {
      query += " AND r.status = ?";
      params.push(status);
    }

    query += " ORDER BY r.reservation_date ASC, r.reservation_time ASC";

    const reservations = db.prepare(query).all(...params);
    return Response.json(reservations);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      guest_name, guest_email, guest_phone, party_size,
      table_id, reservation_date, reservation_time, duration_minutes, notes,
    } = body;

    if (!guest_name || !reservation_date || !reservation_time) {
      return Response.json({ error: "Guest name, date, and time are required" }, { status: 400 });
    }

    const validationError = firstError(
      validatePositiveInt(party_size, "party_size"),
      validatePositiveInt(duration_minutes, "duration_minutes"),
      validateEnum(body.status, "status", VALID_RESERVATION_STATUSES),
    );
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    // Validate table exists and has sufficient capacity
    if (table_id) {
      const table = db.prepare("SELECT id, capacity FROM tables WHERE id = ?").get(table_id) as
        | { id: number; capacity: number }
        | undefined;
      if (!table) {
        return Response.json({ error: "Table not found" }, { status: 404 });
      }
      const effectivePartySize = party_size || 2;
      if (effectivePartySize > table.capacity) {
        return Response.json(
          { error: `Party size exceeds table capacity (${table.capacity})` },
          { status: 400 },
        );
      }
    }

    const result = db.prepare(`
      INSERT INTO reservations (guest_name, guest_email, guest_phone, party_size, table_id, reservation_date, reservation_time, duration_minutes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      guest_name,
      guest_email || "",
      guest_phone || "",
      party_size || 2,
      table_id || null,
      reservation_date,
      reservation_time,
      duration_minutes || 120,
      notes || "",
    );

    const reservation = db.prepare("SELECT * FROM reservations WHERE id = ?").get(result.lastInsertRowid);
    return Response.json(reservation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
