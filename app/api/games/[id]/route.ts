import { getDb } from "@/lib/db";
import { conditionScoreForLabel, CONDITION_LABELS } from "@/lib/game-utils";
import { firstError, validatePositiveInt, validateRange, validateEnum } from "@/lib/validation";
import type { Game } from "@/lib/types";

type GameRow = Pick<
  Game,
  | "id"
  | "title"
  | "min_players"
  | "max_players"
  | "play_time_minutes"
  | "complexity"
  | "category"
  | "description"
  | "image_url"
  | "copies_total"
  | "copies_available"
  | "condition"
  | "condition_score"
  | "shelf_location"
  | "replacement_threshold"
>;

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

    const validationError = firstError(
      validatePositiveInt(body.min_players, "min_players"),
      validatePositiveInt(body.max_players, "max_players"),
      validatePositiveInt(body.play_time_minutes, "play_time_minutes"),
      validateRange(body.complexity, "complexity", 0, 5),
      validatePositiveInt(body.copies_total, "copies_total"),
      validateEnum(body.condition, "condition", CONDITION_LABELS),
      validatePositiveInt(body.replacement_threshold, "replacement_threshold"),
    );
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
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
            needs_replacement = CASE
              WHEN ? <= 2 THEN 1
              WHEN (
                SELECT COUNT(*) FROM game_checkouts gc WHERE gc.game_id = ?
              ) >= ? THEN 1
              ELSE 0
            END,
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
      score,
      Number(id),
      replacementThreshold,
      id,
    );

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
