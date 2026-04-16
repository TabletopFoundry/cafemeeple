import { getDb } from "@/lib/db";

interface GameRow {
  id: number;
  title: string;
  min_players: number;
  max_players: number;
  play_time_minutes: number;
  complexity: number;
  category: string;
  description: string;
  image_url: string;
  copies_total: number;
  copies_available: number;
  condition: string;
  condition_score: number;
  shelf_location: string;
  replacement_threshold: number;
}

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const body = await request.json();

    const existing = db.prepare("SELECT * FROM games WHERE id = ?").get(id) as GameRow | undefined;
    if (!existing) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    const condition = body.condition ?? existing.condition;
    const score = body.condition_score ?? conditionScoreForLabel(condition);
    const copiesTotal = body.copies_total ?? existing.copies_total;
    const checkedOutCopies = existing.copies_total - existing.copies_available;
    const copiesAvailable = body.copies_available ?? Math.max(copiesTotal - checkedOutCopies, 0);
    const replacementThreshold = body.replacement_threshold ?? existing.replacement_threshold;

    db.prepare(
      `
        UPDATE games
        SET title = ?,
            min_players = ?,
            max_players = ?,
            play_time_minutes = ?,
            complexity = ?,
            category = ?,
            description = ?,
            image_url = ?,
            copies_total = ?,
            copies_available = ?,
            condition = ?,
            condition_score = ?,
            shelf_location = ?,
            replacement_threshold = ?,
            last_inspected_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `,
    ).run(
      body.title ?? existing.title,
      body.min_players ?? existing.min_players,
      body.max_players ?? existing.max_players,
      body.play_time_minutes ?? existing.play_time_minutes,
      body.complexity ?? existing.complexity,
      body.category ?? existing.category,
      body.description ?? existing.description,
      body.image_url ?? existing.image_url,
      copiesTotal,
      copiesAvailable,
      condition,
      score,
      body.shelf_location ?? existing.shelf_location,
      replacementThreshold,
      id,
    );

    db.prepare(
      `
        UPDATE games
        SET needs_replacement = CASE
          WHEN condition_score <= 2 THEN 1
          WHEN (
            SELECT COUNT(*)
            FROM game_checkouts gc
            WHERE gc.game_id = games.id
          ) >= replacement_threshold THEN 1
          ELSE 0
        END
        WHERE id = ?
      `,
    ).run(id);

    const game = db.prepare("SELECT * FROM games WHERE id = ?").get(id);
    return Response.json(game);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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
