import { getDb } from "@/lib/db";
import { firstError, validatePositiveInt, validateEnum, validateMaxLength } from "@/lib/validation";
import { VALID_RESERVATION_STATUSES, DEFAULT_RESERVATION_DURATION, MAX_TEXT_LENGTHS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const status = url.searchParams.get("status");
    const limitParam = Number(url.searchParams.get("limit") || (date ? 150 : 250));
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.trunc(limitParam), 1), 500)
      : (date ? 150 : 250);

    let query = "SELECT r.*, t.name as table_name FROM reservations r LEFT JOIN tables t ON r.table_id = t.id WHERE 1=1";
    const params: (string | number)[] = [];

    if (date) {
      query += " AND r.reservation_date = ?";
      params.push(date);
    }
    if (status) {
      query += " AND r.status = ?";
      params.push(status);
    }

    query += " ORDER BY r.reservation_date ASC, r.reservation_time ASC LIMIT ?";
    params.push(limit);

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
      validateMaxLength(guest_name, "guest_name", MAX_TEXT_LENGTHS.guestName),
      validateMaxLength(guest_email, "guest_email", MAX_TEXT_LENGTHS.guestEmail),
      validateMaxLength(guest_phone, "guest_phone", MAX_TEXT_LENGTHS.guestPhone),
      validateMaxLength(notes, "notes", MAX_TEXT_LENGTHS.reservationNotes),
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

    // Check for time-slot overlaps with existing reservations on the same table
    if (table_id) {
      const overlap = db.prepare(`
        SELECT id FROM reservations
        WHERE table_id = ?
          AND reservation_date = ?
          AND status IN ('confirmed', 'pending')
          AND time(?, '+' || ? || ' minutes') > time(reservation_time)
          AND time(reservation_time, '+' || duration_minutes || ' minutes') > time(?)
        LIMIT 1
      `).get(table_id, reservation_date, reservation_time, duration_minutes || DEFAULT_RESERVATION_DURATION, reservation_time);

      if (overlap) {
        return Response.json(
          { error: "This table already has a reservation during that time slot" },
          { status: 409 },
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
      duration_minutes || DEFAULT_RESERVATION_DURATION,
      notes || "",
    );

    const reservation = db.prepare("SELECT * FROM reservations WHERE id = ?").get(result.lastInsertRowid);
    return Response.json(reservation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
