import { getDb } from "@/lib/db";

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
    db.prepare(`UPDATE reservations SET ${fields.join(", ")} WHERE id = ?`).run(...values);

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
    db.prepare("DELETE FROM reservations WHERE id = ?").run(id);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
