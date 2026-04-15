import { getDb } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const body = await request.json();
    const { action } = body;

    if (action === "checkout") {
      const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as {
        table_id: number; party_size: number; cover_charge_per_person: number;
      } | undefined;
      if (!session) {
        return Response.json({ error: "Session not found" }, { status: 404 });
      }

      const total = session.party_size * session.cover_charge_per_person;

      db.prepare(`
        UPDATE sessions SET status = 'completed', ended_at = datetime('now'), total_charge = ? WHERE id = ?
      `).run(total, id);

      db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(session.table_id);

      // Return any checked-out games
      db.prepare(`
        UPDATE game_checkouts SET returned_at = datetime('now'), return_condition = 'Good' WHERE session_id = ? AND returned_at IS NULL
      `).run(id);

      const updated = db.prepare(`
        SELECT s.*, t.name as table_name FROM sessions s JOIN tables t ON s.table_id = t.id WHERE s.id = ?
      `).get(id);

      return Response.json(updated);
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
