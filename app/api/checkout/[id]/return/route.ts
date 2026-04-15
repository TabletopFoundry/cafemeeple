import { getDb } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const body = await request.json();
    const { return_condition, notes } = body;

    const checkout = db.prepare("SELECT * FROM game_checkouts WHERE id = ?").get(id) as {
      game_id: number; returned_at: string | null;
    } | undefined;

    if (!checkout) {
      return Response.json({ error: "Checkout not found" }, { status: 404 });
    }

    if (checkout.returned_at) {
      return Response.json({ error: "Game already returned" }, { status: 400 });
    }

    db.prepare(`
      UPDATE game_checkouts SET returned_at = datetime('now'), return_condition = ?, notes = ? WHERE id = ?
    `).run(return_condition || "Good", notes || "", id);

    db.prepare("UPDATE games SET copies_available = copies_available + 1 WHERE id = ?").run(checkout.game_id);

    // Update game condition if needed
    if (return_condition && return_condition !== "Good" && return_condition !== "Excellent") {
      db.prepare("UPDATE games SET condition = ?, needs_replacement = CASE WHEN ? IN ('Worn', 'Needs Replacement') THEN 1 ELSE 0 END WHERE id = ?")
        .run(return_condition, return_condition, checkout.game_id);
    }

    const updated = db.prepare(`
      SELECT gc.*, g.title as game_title FROM game_checkouts gc JOIN games g ON gc.game_id = g.id WHERE gc.id = ?
    `).get(id);

    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
