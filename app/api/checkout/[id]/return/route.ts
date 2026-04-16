import { getDb } from "@/lib/db";

function conditionScoreForLabel(condition: string) {
  switch (condition) {
    case "Excellent":
      return 5;
    case "Good":
      return 4;
    case "Fair":
      return 3;
    case "Worn":
      return 2;
    case "Needs Replacement":
      return 1;
    default:
      return 4;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const body = await request.json();
    const { return_condition, notes } = body;

    const checkout = db.prepare("SELECT * FROM game_checkouts WHERE id = ?").get(id) as
      | { game_id: number; returned_at: string | null }
      | undefined;

    if (!checkout) {
      return Response.json({ error: "Checkout not found" }, { status: 404 });
    }

    if (checkout.returned_at) {
      return Response.json({ error: "Game already returned" }, { status: 400 });
    }

    const condition = return_condition || "Good";
    const conditionScore = conditionScoreForLabel(condition);

    db.prepare(
      `UPDATE game_checkouts SET returned_at = datetime('now'), return_condition = ?, notes = ? WHERE id = ?`,
    ).run(condition, notes || "", id);

    db.prepare(
      `
        UPDATE games
        SET copies_available = copies_available + 1,
            condition = ?,
            condition_score = ?,
            last_inspected_at = datetime('now'),
            needs_replacement = CASE WHEN ? <= 2 THEN 1 ELSE needs_replacement END,
            updated_at = datetime('now')
        WHERE id = ?
      `,
    ).run(condition, conditionScore, conditionScore, checkout.game_id);

    db.prepare(
      `
        UPDATE games
        SET needs_replacement = CASE
          WHEN condition_score <= 2 THEN 1
          WHEN (
            SELECT COUNT(*) FROM game_checkouts gc WHERE gc.game_id = games.id
          ) >= replacement_threshold THEN 1
          ELSE 0
        END
        WHERE id = ?
      `,
    ).run(checkout.game_id);

    const updated = db.prepare(`
      SELECT gc.*, g.title as game_title
      FROM game_checkouts gc
      JOIN games g ON gc.game_id = g.id
      WHERE gc.id = ?
    `).get(id);

    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
