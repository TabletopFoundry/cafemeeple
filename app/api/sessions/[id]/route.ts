import { getDb } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const body = await request.json();
    const { action } = body;

    if (action !== "checkout") {
      return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    const session = db.prepare(`
      SELECT s.*, t.name as table_name
      FROM sessions s
      JOIN tables t ON t.id = s.table_id
      WHERE s.id = ?
    `).get(id) as
      | {
          table_id: number;
          table_name: string;
          party_name: string;
          party_size: number;
          rate_type: string;
          cover_charge_per_person: number;
        }
      | undefined;

    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const activeGames = db
      .prepare("SELECT COUNT(*) as count FROM game_checkouts WHERE session_id = ? AND returned_at IS NULL")
      .get(id) as { count: number };

    const total =
      session.rate_type === "per_table"
        ? session.cover_charge_per_person
        : session.party_size * session.cover_charge_per_person;

    db.prepare(
      `UPDATE sessions SET status = 'completed', ended_at = datetime('now'), total_charge = ? WHERE id = ?`,
    ).run(total, id);

    db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(session.table_id);
    db.prepare(
      `
        UPDATE game_checkouts
        SET returned_at = datetime('now'), return_condition = COALESCE(return_condition, 'Good')
        WHERE session_id = ? AND returned_at IS NULL
      `,
    ).run(id);

    return Response.json({
      sessionId: id,
      tableName: session.table_name,
      partyName: session.party_name,
      total,
      activeGames: activeGames.count,
      rateType: session.rate_type,
      rateAmount: session.cover_charge_per_person,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
