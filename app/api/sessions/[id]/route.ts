import { getDb } from "@/lib/db";
import { conditionScoreForLabel } from "@/lib/game-utils";

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

    if ((session as { status?: string }).status !== "active") {
      return Response.json({ error: "Session is already closed" }, { status: 409 });
    }

    const total =
      session.rate_type === "per_table"
        ? session.cover_charge_per_person
        : session.party_size * session.cover_charge_per_person;

    const closeTx = db.transaction(() => {
      db.prepare(
        `UPDATE sessions SET status = 'completed', ended_at = datetime('now'), total_charge = ? WHERE id = ?`,
      ).run(total, id);
      db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(session.table_id);

      // Get unreturned games before marking them returned
      const unreturned = db.prepare(
        "SELECT game_id FROM game_checkouts WHERE session_id = ? AND returned_at IS NULL"
      ).all(id) as { game_id: number }[];

      db.prepare(
        `UPDATE game_checkouts SET returned_at = datetime('now'), return_condition = COALESCE(return_condition, 'Good') WHERE session_id = ? AND returned_at IS NULL`,
      ).run(id);

      // Restore inventory and update condition metadata for each auto-returned game
      const defaultConditionScore = conditionScoreForLabel("Good");
      for (const { game_id } of unreturned) {
        db.prepare(`
          UPDATE games SET
            copies_available = copies_available + 1,
            condition = 'Good',
            condition_score = ?,
            last_inspected_at = datetime('now'),
            needs_replacement = CASE
              WHEN ? <= 2 THEN 1
              WHEN (SELECT COUNT(*) FROM game_checkouts WHERE game_id = ?) >= replacement_threshold THEN 1
              ELSE 0
            END,
            updated_at = datetime('now')
          WHERE id = ?
        `).run(defaultConditionScore, defaultConditionScore, game_id, game_id);
      }

      return { autoReturnedCount: unreturned.length };
    });
    const { autoReturnedCount } = closeTx();

    return Response.json({
      sessionId: id,
      tableName: session.table_name,
      partyName: session.party_name,
      total,
      autoReturnedGames: autoReturnedCount,
      activeGames: 0,
      rateType: session.rate_type,
      rateAmount: session.cover_charge_per_person,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
