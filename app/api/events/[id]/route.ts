import { getDb } from "@/lib/db";
import { firstError, validatePositiveInt, validateEnum } from "@/lib/validation";
import { VALID_EVENT_TYPES, VALID_EVENT_STATUSES } from "@/lib/constants";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const body = await request.json();
    const fields: string[] = [];
    const values: (string | number)[] = [];

    const allowedFields = [
      "title", "description", "event_date", "start_time", "end_time",
      "capacity", "event_type", "status",
    ];

    const validationError = firstError(
      validatePositiveInt(body.capacity, "capacity"),
      validateEnum(body.event_type, "event_type", VALID_EVENT_TYPES),
      validateEnum(body.status, "status", VALID_EVENT_STATUSES),
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
    const result = db.prepare(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    if (result.changes === 0) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
    return Response.json(event);
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
    db.prepare("DELETE FROM rsvps WHERE event_id = ?").run(id);
    const result = db.prepare("DELETE FROM events WHERE id = ?").run(id);
    if (result.changes === 0) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
