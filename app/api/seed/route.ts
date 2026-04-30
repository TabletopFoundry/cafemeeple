import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  // Guard: only allow seeding in development
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "Seeding is disabled in production" },
      { status: 403 },
    );
  }

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
