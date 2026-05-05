import { getDb } from "@/lib/db";
import { firstError, validateRequired, validatePositiveInt, validateRange, validateEnum, validateMaxLength } from "@/lib/validation";
import { VALID_TABLE_SHAPES, VALID_TABLE_STATUSES, TABLE_SECTIONS, MAX_TEXT_LENGTHS } from "@/lib/constants";

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

    const validationError = firstError(
      validateRequired(body.name, "name"),
      validatePositiveInt(body.capacity, "capacity"),
      validateRange(body.x_position, "x_position", 0, 100),
      validateRange(body.y_position, "y_position", 0, 100),
      validateEnum(body.shape, "shape", VALID_TABLE_SHAPES),
      validateEnum(body.section, "section", TABLE_SECTIONS),
      validateEnum(body.status, "status", VALID_TABLE_STATUSES),
      validateMaxLength(body.name, "name", MAX_TEXT_LENGTHS.tableName),
    );
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const allowedFields = ["name", "capacity", "section", "x_position", "y_position", "shape", "status"];
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

    try {
      const result = db.prepare(`UPDATE tables SET ${fields.join(", ")} WHERE id = ?`).run(...values);
      if (result.changes === 0) {
        return Response.json({ error: "Table not found" }, { status: 404 });
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
        return Response.json({ error: "A table with this name already exists" }, { status: 409 });
      }
      throw err;
    }

    const table = db.prepare("SELECT * FROM tables WHERE id = ?").get(id);
    return Response.json(table);
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
    const deleteTableTx = db.transaction(() => {
      const activeSession = db.prepare(
        "SELECT id FROM sessions WHERE table_id = ? AND status = 'active' LIMIT 1"
      ).get(id);
      if (activeSession) {
        throw new Error("ACTIVE_SESSION");
      }

      const upcomingReservation = db.prepare(
        "SELECT id FROM reservations WHERE table_id = ? AND status IN ('confirmed', 'pending') AND reservation_date >= date('now') LIMIT 1"
      ).get(id);
      if (upcomingReservation) {
        throw new Error("UPCOMING_RESERVATION");
      }

      const historicalUsage = db.prepare(`
        SELECT
          EXISTS(SELECT 1 FROM sessions WHERE table_id = ?) as has_sessions,
          EXISTS(SELECT 1 FROM reservations WHERE table_id = ?) as has_reservations
      `).get(id, id) as { has_sessions: number; has_reservations: number };
      if (historicalUsage.has_sessions || historicalUsage.has_reservations) {
        throw new Error("HAS_HISTORY");
      }

      const result = db.prepare("DELETE FROM tables WHERE id = ?").run(id);
      if (result.changes === 0) {
        throw new Error("TABLE_NOT_FOUND");
      }
    });

    try {
      deleteTableTx.immediate();
    } catch (txError) {
      if (txError instanceof Error && txError.message === "ACTIVE_SESSION") {
        return Response.json(
          { error: "Cannot delete a table with an active session" },
          { status: 409 },
        );
      }
      if (txError instanceof Error && txError.message === "UPCOMING_RESERVATION") {
        return Response.json(
          { error: "Cannot delete a table with upcoming reservations" },
          { status: 409 },
        );
      }
      if (txError instanceof Error && txError.message === "HAS_HISTORY") {
        return Response.json(
          { error: "Cannot delete a table with session or reservation history. Mark it as maintenance instead." },
          { status: 409 },
        );
      }
      if (txError instanceof Error && txError.message === "TABLE_NOT_FOUND") {
        return Response.json({ error: "Table not found" }, { status: 404 });
      }
      throw txError;
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
