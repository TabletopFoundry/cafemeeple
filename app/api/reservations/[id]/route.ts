import { getDb } from "@/lib/db";
import { firstError, validatePositiveInt, validateEnum } from "@/lib/validation";
import { VALID_RESERVATION_STATUSES } from "@/lib/constants";

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

    values.push(id);
    const result = db.prepare(`UPDATE reservations SET ${fields.join(", ")} WHERE id = ?`).run(...values);
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
