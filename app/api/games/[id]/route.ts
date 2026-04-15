import { getDb } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const game = db.prepare("SELECT * FROM games WHERE id = ?").get(id);
    if (!game) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }
    return Response.json(game);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

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
      "title", "min_players", "max_players", "play_time_minutes",
      "complexity", "category", "description", "copies_total",
      "copies_available", "condition", "needs_replacement", "shelf_location",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (fields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE games SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    const game = db.prepare("SELECT * FROM games WHERE id = ?").get(id);
    return Response.json(game);
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
    const result = db.prepare("DELETE FROM games WHERE id = ?").run(id);
    if (result.changes === 0) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
