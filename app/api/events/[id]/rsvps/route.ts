import { getDb } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const rsvps = db.prepare("SELECT * FROM rsvps WHERE event_id = ? ORDER BY created_at DESC").all(id);
    return Response.json(rsvps);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const body = await request.json();
    const { guest_name, guest_email, party_size } = body;

    if (!guest_name) {
      return Response.json({ error: "Guest name is required" }, { status: 400 });
    }

    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as { capacity: number } | undefined;
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const currentRsvps = db.prepare("SELECT SUM(party_size) as total FROM rsvps WHERE event_id = ?").get(id) as { total: number | null };
    const currentTotal = currentRsvps.total || 0;
    const newPartySize = party_size || 1;

    if (currentTotal + newPartySize > event.capacity) {
      return Response.json({ error: "Event is at capacity" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO rsvps (event_id, guest_name, guest_email, party_size)
      VALUES (?, ?, ?, ?)
    `).run(id, guest_name, guest_email || "", newPartySize);

    db.prepare("UPDATE events SET rsvp_count = ? WHERE id = ?").run(currentTotal + newPartySize, id);

    const rsvp = db.prepare("SELECT * FROM rsvps WHERE id = ?").get(result.lastInsertRowid);
    return Response.json(rsvp, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
