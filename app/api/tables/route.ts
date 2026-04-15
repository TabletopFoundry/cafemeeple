import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const tables = db.prepare("SELECT * FROM tables ORDER BY name ASC").all();
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

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO tables (name, capacity, section, x_position, y_position, shape)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, capacity || 4, section || "Main Floor", x_position || 0, y_position || 0, shape || "rectangle");

    const table = db.prepare("SELECT * FROM tables WHERE id = ?").get(result.lastInsertRowid);
    return Response.json(table, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
