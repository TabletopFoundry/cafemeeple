import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const events = db.prepare(`
      SELECT e.*, (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id) as actual_rsvps
      FROM events e ORDER BY e.event_date ASC
    `).all();
    return Response.json(events);
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
      title, description, event_date, start_time, end_time,
      capacity, event_type, status,
    } = body;

    if (!title || !event_date || !start_time || !end_time) {
      return Response.json({ error: "Title, date, start time, and end time are required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO events (title, description, event_date, start_time, end_time, capacity, event_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || "",
      event_date,
      start_time,
      end_time,
      capacity || 20,
      event_type || "Game Night",
      status || "upcoming",
    );

    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(result.lastInsertRowid);
    return Response.json(event, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
