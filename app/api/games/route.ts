import { getDb } from "@/lib/db";
import { conditionScoreForLabel } from "@/lib/game-utils";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const condition = url.searchParams.get("condition") || "";
    const needsReplacement = url.searchParams.get("needsReplacement") === "true";
    const playerCount = Number(url.searchParams.get("playerCount") || 0);
    const complexity = url.searchParams.get("complexity") || "";

    let query = `
      SELECT
        g.*,
        COALESCE(gc.checkout_count, 0) as checkout_count,
        gc.last_checked_out_at,
        CASE
          WHEN g.condition_score <= 2 THEN 1
          WHEN COALESCE(gc.checkout_count, 0) >= g.replacement_threshold THEN 1
          WHEN g.condition = 'Needs Replacement' THEN 1
          ELSE 0
        END as computed_needs_replacement
      FROM games g
      LEFT JOIN (
        SELECT game_id, COUNT(*) as checkout_count, MAX(checked_out_at) as last_checked_out_at
        FROM game_checkouts
        GROUP BY game_id
      ) gc ON gc.game_id = g.id
      WHERE 1 = 1
    `;

    const params: (string | number)[] = [];

    if (search) {
      query += " AND (g.title LIKE ? OR g.category LIKE ? OR g.shelf_location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      query += " AND g.category = ?";
      params.push(category);
    }

    if (condition) {
      query += " AND g.condition = ?";
      params.push(condition);
    }

    if (playerCount > 0) {
      query += " AND g.min_players <= ? AND g.max_players >= ?";
      params.push(playerCount, playerCount);
    }

    if (complexity === "light") {
      query += " AND g.complexity < 2.0";
    }
    if (complexity === "mid") {
      query += " AND g.complexity >= 2.0 AND g.complexity < 3.2";
    }
    if (complexity === "heavy") {
      query += " AND g.complexity >= 3.2";
    }

    if (needsReplacement) {
      query += " AND (g.condition_score <= 2 OR COALESCE(gc.checkout_count, 0) >= g.replacement_threshold OR g.condition = 'Needs Replacement')";
    }

    query += " ORDER BY g.title ASC";

    const games = (db.prepare(query).all(...params) as Record<string, unknown>[]).map((game) => ({
      ...game,
      needs_replacement: game.computed_needs_replacement,
    }));

    return Response.json(games);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      title,
      min_players,
      max_players,
      play_time_minutes,
      complexity,
      category,
      description,
      image_url,
      copies_total,
      condition,
      condition_score,
      shelf_location,
      replacement_threshold,
    } = body;

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const score = condition_score ?? conditionScoreForLabel(condition || "Good");
    const result = db
      .prepare(
        `
          INSERT INTO games (
            title, min_players, max_players, play_time_minutes, complexity, category, description,
            image_url, copies_total, copies_available, condition, condition_score, shelf_location,
            replacement_threshold, last_inspected_at, needs_replacement
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
        `,
      )
      .run(
        title,
        min_players || 1,
        max_players || 4,
        play_time_minutes || 30,
        complexity || 2.5,
        category || "Strategy",
        description || "",
        image_url || "",
        copies_total || 1,
        copies_total || 1,
        condition || "Good",
        score,
        shelf_location || "",
        replacement_threshold || 12,
        score <= 2 ? 1 : 0,
      );

    const game = db.prepare("SELECT * FROM games WHERE id = ?").get(result.lastInsertRowid);
    return Response.json(game, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
