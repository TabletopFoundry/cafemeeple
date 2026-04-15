import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    const result = seedDatabase();
    return Response.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const games = db.prepare("SELECT COUNT(*) as count FROM games").get() as { count: number };
    return Response.json({
      seeded: games.count > 0,
      games: games.count,
    });
  } catch {
    return Response.json({ seeded: false, games: 0 });
  }
}
