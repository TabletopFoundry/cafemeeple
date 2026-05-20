import { getDb } from "@/lib/db";
import { firstError, validatePositiveInt, validateMaxLength } from "@/lib/validation";
import { MAX_TEXT_LENGTHS } from "@/lib/constants";

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

    const validationError = firstError(
      validatePositiveInt(party_size, "party_size"),
      validateMaxLength(guest_name, "guest_name", MAX_TEXT_LENGTHS.guestName),
      validateMaxLength(guest_email, "guest_email", MAX_TEXT_LENGTHS.guestEmail),
    );
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as
      | { capacity: number; status: string }
      | undefined;
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status === "cancelled" || event.status === "completed") {
      return Response.json({ error: "RSVPs are closed for this event" }, { status: 409 });
    }

    const newPartySize = party_size || 1;

    const rsvpTx = db.transaction(() => {
      const currentRsvps = db.prepare(
        "SELECT COALESCE(SUM(party_size), 0) as total FROM rsvps WHERE event_id = ?"
      ).get(id) as { total: number };
      const currentTotal = currentRsvps.total;

      if (currentTotal + newPartySize > event.capacity) {
        throw new Error("CAPACITY_EXCEEDED");
      }

      const result = db.prepare(`
        INSERT INTO rsvps (event_id, guest_name, guest_email, party_size)
        VALUES (?, ?, ?, ?)
      `).run(id, guest_name, guest_email || "", newPartySize);

      const updatedTotal = db.prepare(
        "SELECT COALESCE(SUM(party_size), 0) as total FROM rsvps WHERE event_id = ?"
      ).get(id) as { total: number };
      db.prepare("UPDATE events SET rsvp_count = ? WHERE id = ?")
        .run(updatedTotal.total, id);

      return result;
    });

    try {
      const result = rsvpTx();
      const rsvp = db.prepare("SELECT * FROM rsvps WHERE id = ?").get(result.lastInsertRowid);
      return Response.json(rsvp, { status: 201 });
    } catch (txError) {
      if (txError instanceof Error && txError.message === "CAPACITY_EXCEEDED") {
        return Response.json({ error: "Event is at capacity" }, { status: 400 });
      }
      throw txError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
