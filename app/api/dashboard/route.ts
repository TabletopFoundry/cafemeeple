import { getDb } from "@/lib/db";
import type { AlertType, AlertSeverity } from "@/lib/types";

const DASHBOARD_ESTIMATES = {
  avgFoodBeveragePerPerson: 11.5,
  avgRetailPerCheckout: 4.25,
  avgEventTicketPerPerson: 9.5,
} as const;

export async function GET() {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    const activeTables = db
      .prepare("SELECT COUNT(*) as count FROM sessions WHERE status = 'active'")
      .get() as { count: number };

    const gamesCheckedOut = db
      .prepare("SELECT COUNT(*) as count FROM game_checkouts WHERE returned_at IS NULL")
      .get() as { count: number };

    const visitors = db
      .prepare(
        `SELECT COALESCE(SUM(party_size), 0) as count FROM sessions WHERE date(started_at) = ?`,
      )
      .get(today) as { count: number };

    const todayRevenue = db
      .prepare(
        `
          SELECT COALESCE(SUM(
            CASE
              WHEN status = 'completed' THEN total_charge
              WHEN rate_type = 'per_table' THEN cover_charge_per_person
              ELSE cover_charge_per_person * party_size
            END
          ), 0) as total
          FROM sessions
          WHERE date(started_at) = ?
        `,
      )
      .get(today) as { total: number };

    const reservationCount = db
      .prepare(
        `SELECT COUNT(*) as count FROM reservations WHERE reservation_date = ? AND status IN ('confirmed', 'pending')`,
      )
      .get(today) as { count: number };

    const coverCharges = db
      .prepare(
        `SELECT 'Cover Charges' as category, ROUND(COALESCE(SUM(total_charge), 0), 2) as value
         FROM sessions
         WHERE started_at >= date('now', '-30 days') AND status = 'completed'`
      )
      .get() as { category: string; value: number };

    const foodBeverage = db
      .prepare(
        `SELECT 'Food & Beverage' as category, ROUND(COALESCE(SUM(party_size * ?), 0), 2) as value
         FROM sessions
         WHERE started_at >= date('now', '-30 days')`
      )
      .get(DASHBOARD_ESTIMATES.avgFoodBeveragePerPerson) as { category: string; value: number };

    const retail = db
      .prepare(
        `SELECT 'Retail' as category, ROUND(COALESCE(COUNT(*) * ?, 0), 2) as value
         FROM game_checkouts
         WHERE checked_out_at >= date('now', '-30 days')`
      )
      .get(DASHBOARD_ESTIMATES.avgRetailPerCheckout) as { category: string; value: number };

    const events = db
      .prepare(
        `SELECT 'Events' as category, ROUND(COALESCE(SUM(r.party_size) * ?, 0), 2) as value
         FROM rsvps r
         JOIN events e ON e.id = r.event_id
         WHERE e.event_date >= date('now', '-30 days')`
      )
      .get(DASHBOARD_ESTIMATES.avgEventTicketPerPerson) as { category: string; value: number };

    const revenueBreakdown = [coverCharges, foodBeverage, retail, events];

    const popularGamesWeek = db
      .prepare(
        `
          SELECT g.title, g.category, COUNT(gc.id) as checkout_count
          FROM game_checkouts gc
          JOIN games g ON g.id = gc.game_id
          WHERE gc.checked_out_at >= date('now', '-7 days')
          GROUP BY gc.game_id
          ORDER BY checkout_count DESC, g.title ASC
          LIMIT 5
        `,
      )
      .all();

    const popularGamesMonth = db
      .prepare(
        `
          SELECT g.title, g.category, COUNT(gc.id) as checkout_count
          FROM game_checkouts gc
          JOIN games g ON g.id = gc.game_id
          WHERE gc.checked_out_at >= date('now', '-30 days')
          GROUP BY gc.game_id
          ORDER BY checkout_count DESC, g.title ASC
          LIMIT 5
        `,
      )
      .all();

    const upcomingEvents = db
      .prepare(
        `
          SELECT e.*, COALESCE((SELECT SUM(r.party_size) FROM rsvps r WHERE r.event_id = e.id), 0) as actual_rsvps
          FROM events e
          WHERE e.event_date >= ?
          ORDER BY e.event_date ASC
          LIMIT 4
        `,
      )
      .all(today);

    const replacementCount = db
      .prepare(
        `
          SELECT COUNT(*) as count
          FROM games g
          LEFT JOIN (
            SELECT game_id, COUNT(*) as checkout_count
            FROM game_checkouts
            GROUP BY game_id
          ) gc ON gc.game_id = g.id
          WHERE g.condition_score <= 2
             OR COALESCE(gc.checkout_count, 0) >= g.replacement_threshold
        `,
      )
      .get() as { count: number };

    const lowInventoryGames = db
      .prepare(
        `
          SELECT title, copies_available, copies_total
          FROM games
          WHERE copies_available <= 1 AND copies_total > 1
          ORDER BY copies_available ASC, title ASC
          LIMIT 3
        `,
      )
      .all() as { title: string; copies_available: number; copies_total: number }[];

    const alerts: { type: AlertType; severity: AlertSeverity; message: string }[] = [
      ...(replacementCount.count
        ? [
            {
              type: "replacement" as const,
              severity: "warning" as const,
              message: `${replacementCount.count} titles are trending toward replacement or repair.`,
            },
          ]
        : []),
      ...lowInventoryGames.map((game) => ({
        type: "inventory" as const,
        severity: "info" as const,
        message: `${game.title} is low on shelf stock (${game.copies_available}/${game.copies_total} available).`,
      })),
      ...(reservationCount.count
        ? [
            {
              type: "reservations" as const,
              severity: "info" as const,
              message: `${reservationCount.count} reservations still need seating or confirmation today.`,
            },
          ]
        : []),
    ];

    return Response.json({
      today: {
        activeTables: activeTables.count,
        gamesCheckedOut: gamesCheckedOut.count,
        revenue: todayRevenue.total,
        visitors: visitors.count,
      },
      revenueBreakdown,
      popularGamesWeek,
      popularGamesMonth,
      upcomingEvents,
      alerts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
