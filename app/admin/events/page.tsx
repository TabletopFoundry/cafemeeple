"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorMessage, EmptyState, Badge } from "@/components/ui";
import { Plus, X, Users, CalendarDays, Edit2, Trash2 } from "lucide-react";

interface EventItem {
  id: number;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  rsvp_count: number;
  actual_rsvps: number;
  event_type: string;
  status: string;
}

interface Rsvp {
  id: number;
  event_id: number;
  guest_name: string;
  guest_email: string;
  party_size: number;
  status: string;
}

const EVENT_TYPES = ["Game Night", "Tournament", "Workshop", "Social", "Family Event", "Special"];

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [viewingRsvps, setViewingRsvps] = useState<EventItem | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError(null);
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Failed to load events");
        if (!cancelled) setEvents(await res.json());
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this event? All RSVPs will also be removed.")) return;
    try {
      await fetch(`/api/events/${id}`, { method: "DELETE" });
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to delete event");
    }
  };

  const viewRsvps = async (event: EventItem) => {
    setViewingRsvps(event);
    try {
      const res = await fetch(`/api/events/${event.id}/rsvps`);
      if (res.ok) setRsvps(await res.json());
    } catch {
      setRsvps([]);
    }
  };

  const addRsvp = async (eventId: number, guestName: string, guestEmail: string, partySize: number) => {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_name: guestName, guest_email: guestEmail, party_size: partySize }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add RSVP");
      }
      // Refresh RSVPs
      const rsvpRes = await fetch(`/api/events/${eventId}/rsvps`);
      if (rsvpRes.ok) setRsvps(await rsvpRes.json());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add RSVP");
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "upcoming": return "info" as const;
      case "completed": return "success" as const;
      case "cancelled": return "danger" as const;
      default: return "default" as const;
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={() => setRefreshKey((k) => k + 1)} />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">{events.length} events</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={16} />
          Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="No events yet"
          description="Create your first event to start managing game nights and tournaments."
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              Create Event
            </button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => {
            const fillPercent = event.capacity > 0 ? Math.round((event.actual_rsvps / event.capacity) * 100) : 0;
            return (
              <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                    <span className="text-xs text-gray-400 font-medium">{event.event_type}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{event.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={14} />
                      {new Date(event.event_date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>{event.start_time} – {event.end_time}</span>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Users size={14} />
                        {event.actual_rsvps} / {event.capacity}
                      </span>
                      <span className="text-gray-500">{fillPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          fillPercent >= 90 ? "bg-red-500" : fillPercent >= 70 ? "bg-amber-500" : "bg-violet-500"
                        }`}
                        style={{ width: `${Math.min(fillPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewRsvps(event)}
                      className="flex-1 text-center px-3 py-1.5 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                    >
                      RSVPs
                    </button>
                    <button
                      onClick={() => setEditingEvent(event)}
                      className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Add/Edit Modal */}
      {(showAddModal || editingEvent) && (
        <EventModal
          event={editingEvent}
          onClose={() => {
            setShowAddModal(false);
            setEditingEvent(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setEditingEvent(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* RSVP Modal */}
      {viewingRsvps && (
        <RsvpModal
          event={viewingRsvps}
          rsvps={rsvps}
          onClose={() => setViewingRsvps(null)}
          onAddRsvp={addRsvp}
        />
      )}
    </div>
  );
}

function EventModal({
  event,
  onClose,
  onSaved,
}: {
  event: EventItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    event_date: event?.event_date || new Date().toISOString().split("T")[0],
    start_time: event?.start_time || "18:00",
    end_time: event?.end_time || "22:00",
    capacity: event?.capacity || 20,
    event_type: event?.event_type || "Game Night",
    status: event?.status || "upcoming",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = event ? `/api/events/${event.id}` : "/api/events";
      const method = event ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
    } catch {
      alert("Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{event ? "Edit Event" : "Create Event"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 20 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          {event && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : event ? "Update Event" : "Create Event"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RsvpModal({
  event,
  rsvps,
  onClose,
  onAddRsvp,
}: {
  event: EventItem;
  rsvps: Rsvp[];
  onClose: () => void;
  onAddRsvp: (eventId: number, name: string, email: string, partySize: number) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(1);

  const handleAdd = () => {
    if (!name) return;
    onAddRsvp(event.id, name, email, partySize);
    setName("");
    setEmail("");
    setPartySize(1);
    setShowAdd(false);
  };

  const totalAttendees = rsvps.reduce((sum, r) => sum + r.party_size, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold">{event.title}</h2>
            <p className="text-sm text-gray-500">{totalAttendees} / {event.capacity} attendees</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-sm text-gray-700">RSVPs ({rsvps.length})</h3>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              {showAdd ? "Cancel" : "+ Add RSVP"}
            </button>
          </div>

          {showAdd && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4 space-y-3">
              <input
                type="text"
                placeholder="Guest name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="Party size"
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700"
                >
                  Add RSVP
                </button>
              </div>
            </div>
          )}

          {rsvps.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No RSVPs yet</p>
          ) : (
            <div className="space-y-2">
              {rsvps.map((rsvp) => (
                <div key={rsvp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rsvp.guest_name}</p>
                    <p className="text-xs text-gray-500">{rsvp.guest_email || "No email"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{rsvp.party_size} guest{rsvp.party_size > 1 ? "s" : ""}</span>
                    <Badge variant="success">{rsvp.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
