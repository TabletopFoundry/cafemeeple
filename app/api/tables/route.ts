import { getDb } from "@/lib/db";
import { firstError, validateRequired, validatePositiveInt, validateRange, validateEnum } from "@/lib/validation";
import { VALID_TABLE_SHAPES, TABLE_SECTIONS } from "@/lib/constants";

export async function GET() {
  try {
    const db = getDb();
    const tables = db.prepare(`
      SELECT
        t.*,
        CASE
          WHEN t.status = 'maintenance' THEN 'maintenance'
          WHEN EXISTS (SELECT 1 FROM sessions s WHERE s.table_id = t.id AND s.status = 'active') THEN 'occupied'
          WHEN EXISTS (
            SELECT 1
            FROM reservations r
            WHERE r.table_id = t.id
              AND r.reservation_date = date('now')
              AND r.status IN ('confirmed', 'pending')
              AND time('now', 'localtime') < time(r.reservation_time, '+' || r.duration_minutes || ' minutes')
              AND time('now', 'localtime', '+30 minutes') > time(r.reservation_time)
          ) THEN 'reserved'
          ELSE 'available'
        END as status
      FROM tables t
      ORDER BY t.name ASC
    `).all();

    return Response.json(tables);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, capacity, section, x_position, y_position, shape } = body;

    const validationError = firstError(
      validateRequired(name, "name"),
      validatePositiveInt(capacity, "capacity"),
      validateRange(x_position, "x_position", 0, 100),
      validateRange(y_position, "y_position", 0, 100),
      validateEnum(shape, "shape", VALID_TABLE_SHAPES),
      validateEnum(section, "section", TABLE_SECTIONS),
    );
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    let result;
    try {
      result = db.prepare(`
        INSERT INTO tables (name, capacity, section, x_position, y_position, shape)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, capacity || 4, section || "Main Floor", x_position || 0, y_position || 0, shape || "rectangle");
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
        return Response.json({ error: "A table with this name already exists" }, { status: 409 });
      }
      throw err;
    }

    const table = db.prepare("SELECT * FROM tables WHERE id = ?").get(result.lastInsertRowid);
    return Response.json(table, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
