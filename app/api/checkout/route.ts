import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    const gameId = url.searchParams.get("game_id");
    const limitParam = Number(url.searchParams.get("limit") || 250);
    const offsetParam = Number(url.searchParams.get("offset") || 0);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.trunc(limitParam), 1), 1000)
      : 250;
    const offset = Number.isFinite(offsetParam)
      ? Math.max(Math.trunc(offsetParam), 0)
      : 0;

    let query = `
      SELECT gc.*, g.title as game_title, g.category as game_category,
             s.party_name, t.name as table_name
      FROM game_checkouts gc
      JOIN games g ON gc.game_id = g.id
      JOIN sessions s ON gc.session_id = s.id
      JOIN tables t ON s.table_id = t.id
      WHERE 1=1
    `;
    const params: Array<string | number> = [];

    if (sessionId) {
      query += " AND gc.session_id = ?";
      params.push(sessionId);
    }
    if (gameId) {
      query += " AND gc.game_id = ?";
      params.push(gameId);
    }

    query += " ORDER BY gc.checked_out_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const checkouts = db.prepare(query).all(...params);
    return Response.json(checkouts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { session_id, game_id } = body;

    if (!session_id || !game_id) {
      return Response.json({ error: "Session ID and Game ID are required" }, { status: 400 });
    }

    const session = db.prepare("SELECT status FROM sessions WHERE id = ?").get(session_id) as
      | { status: string }
      | undefined;
    if (!session || session.status !== "active") {
      return Response.json({ error: "Select an active table session first." }, { status: 400 });
    }

    const checkoutTx = db.transaction(() => {
      const game = db.prepare("SELECT copies_available FROM games WHERE id = ?").get(game_id) as
        | { copies_available: number }
        | undefined;
      if (!game || game.copies_available <= 0) {
        throw new Error("GAME_UNAVAILABLE");
      }

      const result = db.prepare(`
        INSERT INTO game_checkouts (session_id, game_id)
        VALUES (?, ?)
      `).run(session_id, game_id);

      db.prepare("UPDATE games SET copies_available = copies_available - 1, updated_at = datetime('now') WHERE id = ?").run(game_id);

      return result;
    });

    let result;
    try {
      result = checkoutTx();
    } catch (txError) {
      if (txError instanceof Error && txError.message === "GAME_UNAVAILABLE") {
        return Response.json({ error: "Game not available" }, { status: 400 });
      }
      throw txError;
    }

    const checkout = db.prepare(`
      SELECT gc.*, g.title as game_title
      FROM game_checkouts gc
      JOIN games g ON gc.game_id = g.id
      WHERE gc.id = ?
    `).get(result.lastInsertRowid);

    return Response.json(checkout, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
