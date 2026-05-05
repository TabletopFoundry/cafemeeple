import { getDb } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; rsvpId: string }> },
) {
  const { id, rsvpId } = await params;
  try {
    const db = getDb();
    const deleteRsvpTx = db.transaction(() => {
      const event = db.prepare("SELECT id FROM events WHERE id = ?").get(id);
      if (!event) {
        throw new Error("EVENT_NOT_FOUND");
      }

      const rsvp = db.prepare(
        "SELECT id FROM rsvps WHERE id = ? AND event_id = ?",
      ).get(rsvpId, id);
      if (!rsvp) {
        throw new Error("RSVP_NOT_FOUND");
      }

      db.prepare("DELETE FROM rsvps WHERE id = ? AND event_id = ?").run(rsvpId, id);
      const total = db.prepare(
        "SELECT COALESCE(SUM(party_size), 0) as total FROM rsvps WHERE event_id = ?",
      ).get(id) as { total: number };
      db.prepare("UPDATE events SET rsvp_count = ? WHERE id = ?").run(total.total, id);
    });

    try {
      deleteRsvpTx();
    } catch (txError) {
      if (txError instanceof Error && txError.message === "EVENT_NOT_FOUND") {
        return Response.json({ error: "Event not found" }, { status: 404 });
      }
      if (txError instanceof Error && txError.message === "RSVP_NOT_FOUND") {
        return Response.json({ error: "RSVP not found" }, { status: 404 });
      }
      throw txError;
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
