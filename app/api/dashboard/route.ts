import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

export async function GET() {
  try {
    const db = getDb();

    // Ensure data is seeded
    seedDatabase();

    const today = new Date().toISOString().split("T")[0];

    // Today's stats
    const todaySessions = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_charge), 0) as revenue
      FROM sessions WHERE date(started_at) = ?
    `).get(today) as { count: number; revenue: number };

    const activeSessions = db.prepare(`
      SELECT COUNT(*) as count FROM sessions WHERE status = 'active'
    `).get() as { count: number };

    const todayReservations = db.prepare(`
      SELECT COUNT(*) as count FROM reservations WHERE reservation_date = ?
    `).get(today) as { count: number };

    const totalGames = db.prepare(`
      SELECT COUNT(*) as count FROM games
    `).get() as { count: number };

    const gamesNeedingReplacement = db.prepare(`
      SELECT COUNT(*) as count FROM games WHERE needs_replacement = 1
    `).get() as { count: number };

    // Revenue by day (last 7 days)
    const revenueByDay = db.prepare(`
      SELECT date(started_at) as date,
             COALESCE(SUM(total_charge), 0) as revenue,
             COUNT(*) as sessions
      FROM sessions
      WHERE started_at >= date('now', '-7 days') AND status = 'completed'
      GROUP BY date(started_at)
      ORDER BY date ASC
    `).all();

    // Popular games (by checkout count)
    const popularGames = db.prepare(`
      SELECT g.title, g.category, COUNT(gc.id) as checkout_count
      FROM game_checkouts gc
      JOIN games g ON gc.game_id = g.id
      GROUP BY gc.game_id
      ORDER BY checkout_count DESC
      LIMIT 10
    `).all();

    // Revenue by category
    const revenueByHour = db.prepare(`
      SELECT
        CASE
          WHEN CAST(strftime('%H', started_at) AS INTEGER) < 12 THEN 'Morning'
          WHEN CAST(strftime('%H', started_at) AS INTEGER) < 17 THEN 'Afternoon'
          ELSE 'Evening'
        END as period,
        COALESCE(SUM(total_charge), 0) as revenue,
        COUNT(*) as sessions
      FROM sessions
      WHERE started_at >= date('now', '-30 days') AND status = 'completed'
      GROUP BY period
      ORDER BY period
    `).all();

    // Upcoming events
    const upcomingEvents = db.prepare(`
      SELECT * FROM events WHERE event_date >= ? ORDER BY event_date ASC LIMIT 5
    `).all(today);

    // Alerts
    const alerts: { type: string; message: string; severity: string }[] = [];

    if (gamesNeedingReplacement.count > 0) {
      alerts.push({
        type: "games",
        message: `${gamesNeedingReplacement.count} game(s) flagged for replacement`,
        severity: "warning",
      });
    }

    const pendingReservations = db.prepare(`
      SELECT COUNT(*) as count FROM reservations WHERE reservation_date = ? AND status = 'pending'
    `).get(today) as { count: number };

    if (pendingReservations.count > 0) {
      alerts.push({
        type: "reservations",
        message: `${pendingReservations.count} pending reservation(s) for today`,
        severity: "info",
      });
    }

    if (activeSessions.count > 10) {
      alerts.push({
        type: "capacity",
        message: `High occupancy: ${activeSessions.count} active sessions`,
        severity: "warning",
      });
    }

    return Response.json({
      today: {
        sessions: todaySessions.count,
        revenue: todaySessions.revenue,
        activeSessions: activeSessions.count,
        reservations: todayReservations.count,
        totalGames: totalGames.count,
        gamesNeedingReplacement: gamesNeedingReplacement.count,
      },
      revenueByDay,
      popularGames,
      revenueByHour,
      upcomingEvents,
      alerts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
