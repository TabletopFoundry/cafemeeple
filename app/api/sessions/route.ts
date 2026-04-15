import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let query = `
      SELECT s.*, t.name as table_name, t.capacity as table_capacity
      FROM sessions s
      JOIN tables t ON s.table_id = t.id
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
    const { table_id, party_name, party_size, cover_charge_per_person } = body;

    if (!table_id) {
      return Response.json({ error: "Table ID is required" }, { status: 400 });
    }

    // Check table is available
    const table = db.prepare("SELECT * FROM tables WHERE id = ?").get(table_id) as { status: string } | undefined;
    if (!table) {
      return Response.json({ error: "Table not found" }, { status: 404 });
    }
    if (table.status === "occupied") {
      return Response.json({ error: "Table is already occupied" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO sessions (table_id, party_name, party_size, cover_charge_per_person)
      VALUES (?, ?, ?, ?)
    `).run(table_id, party_name || "Walk-in", party_size || 2, cover_charge_per_person || 5.00);

    db.prepare("UPDATE tables SET status = 'occupied' WHERE id = ?").run(table_id);

    const session = db.prepare(`
      SELECT s.*, t.name as table_name FROM sessions s JOIN tables t ON s.table_id = t.id WHERE s.id = ?
    `).get(result.lastInsertRowid);

    return Response.json(session, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
