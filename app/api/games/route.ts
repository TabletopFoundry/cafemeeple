import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const condition = url.searchParams.get("condition") || "";
    const needsReplacement = url.searchParams.get("needsReplacement");

    let query = "SELECT * FROM games WHERE 1=1";
    const params: (string | number)[] = [];

    if (search) {
      query += " AND (title LIKE ? OR category LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    if (condition) {
      query += " AND condition = ?";
      params.push(condition);
    }
    if (needsReplacement === "true") {
      query += " AND needs_replacement = 1";
    }

    query += " ORDER BY title ASC";

    const games = db.prepare(query).all(...params);
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
      title, min_players, max_players, play_time_minutes, complexity,
      category, description, copies_total, condition, shelf_location,
    } = body;

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO games (title, min_players, max_players, play_time_minutes, complexity, category, description, copies_total, copies_available, condition, shelf_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      min_players || 1,
      max_players || 4,
      play_time_minutes || 30,
      complexity || 2.5,
      category || "Strategy",
      description || "",
      copies_total || 1,
      copies_total || 1,
      condition || "Good",
      shelf_location || "",
    );

    const game = db.prepare("SELECT * FROM games WHERE id = ?").get(result.lastInsertRowid);
    return Response.json(game, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
