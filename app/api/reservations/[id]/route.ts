import { getDb } from "@/lib/db";
import { firstError, validatePositiveInt, validateEnum, validateMaxLength } from "@/lib/validation";
import { VALID_RESERVATION_STATUSES, MAX_TEXT_LENGTHS } from "@/lib/constants";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const body = await request.json();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    const allowedFields = [
      "guest_name", "guest_email", "guest_phone", "party_size",
      "table_id", "reservation_date", "reservation_time",
      "duration_minutes", "status", "notes",
    ];

    const validationError = firstError(
      validatePositiveInt(body.party_size, "party_size"),
      validatePositiveInt(body.duration_minutes, "duration_minutes"),
      validateEnum(body.status, "status", VALID_RESERVATION_STATUSES),
      validateMaxLength(body.guest_name, "guest_name", MAX_TEXT_LENGTHS.guestName),
      validateMaxLength(body.guest_email, "guest_email", MAX_TEXT_LENGTHS.guestEmail),
      validateMaxLength(body.guest_phone, "guest_phone", MAX_TEXT_LENGTHS.guestPhone),
      validateMaxLength(body.notes, "notes", MAX_TEXT_LENGTHS.reservationNotes),
    );
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (fields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const updateReservationTx = db.transaction(() => {
      const current = db.prepare("SELECT table_id, reservation_date, reservation_time, duration_minutes, party_size FROM reservations WHERE id = ?").get(id) as
        | {
            table_id: number | null;
            reservation_date: string;
            reservation_time: string;
            duration_minutes: number;
            party_size: number;
          }
        | undefined;

      if (!current) {
        throw new Error("RESERVATION_NOT_FOUND");
      }

      const checkTableId = body.table_id ?? current.table_id;
      const checkDate = body.reservation_date ?? current.reservation_date;
      const checkTime = body.reservation_time ?? current.reservation_time;
      const checkDuration = body.duration_minutes ?? current.duration_minutes;
      const checkPartySize = body.party_size ?? current.party_size;

      if (checkTableId) {
        const table = db.prepare("SELECT id, capacity FROM tables WHERE id = ?").get(checkTableId) as
          | { id: number; capacity: number }
          | undefined;
        if (!table) {
          throw new Error("TABLE_NOT_FOUND");
        }
        if (checkPartySize && checkPartySize > table.capacity) {
          throw new Error(`TABLE_CAPACITY:${table.capacity}`);
        }

        const overlap = db.prepare(`
          SELECT id FROM reservations
          WHERE table_id = ?
            AND reservation_date = ?
            AND status IN ('confirmed', 'pending')
            AND id != ?
            AND time(?, '+' || ? || ' minutes') > time(reservation_time)
            AND time(reservation_time, '+' || duration_minutes || ' minutes') > time(?)
          LIMIT 1
        `).get(checkTableId, checkDate, id, checkTime, checkDuration, checkTime);

        if (overlap) {
          throw new Error("TABLE_OVERLAP");
        }
      }

      values.push(id);
      return db.prepare(`UPDATE reservations SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    });

    let result;
    try {
      result = updateReservationTx();
    } catch (txError) {
      if (txError instanceof Error && txError.message === "RESERVATION_NOT_FOUND") {
        return Response.json({ error: "Reservation not found" }, { status: 404 });
      }
      if (txError instanceof Error && txError.message === "TABLE_NOT_FOUND") {
        return Response.json({ error: "Table not found" }, { status: 404 });
      }
      if (txError instanceof Error && txError.message.startsWith("TABLE_CAPACITY:")) {
        const capacity = txError.message.split(":")[1] || "0";
        return Response.json(
          { error: `Party size exceeds table capacity (${capacity})` },
          { status: 400 },
        );
      }
      if (txError instanceof Error && txError.message === "TABLE_OVERLAP") {
        return Response.json(
          { error: "This table already has a reservation during that time slot" },
          { status: 409 },
        );
      }
      throw txError;
    }

    if (result.changes === 0) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }

    const reservation = db.prepare("SELECT * FROM reservations WHERE id = ?").get(id);
    return Response.json(reservation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const result = db.prepare("DELETE FROM reservations WHERE id = ?").run(id);
    if (result.changes === 0) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
