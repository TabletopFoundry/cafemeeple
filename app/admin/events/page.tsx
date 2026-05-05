"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ErrorMessage, EmptyState, LoadingCard } from "@/components/ui";
import { VALID_EVENT_TYPES } from "@/lib/constants";
import { useFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import { EventItem, Rsvp } from "@/lib/types";
import EventCard from "./components/EventCard";
import EventModal from "./components/EventModal";
import RsvpModal from "./components/RsvpModal";

export default function EventsPage() {
  usePageTitle("Events");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [viewingRsvps, setViewingRsvps] = useState<EventItem | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { data: events, loading, error, refresh } = useFetch<EventItem[]>("/api/events?limit=100");
  const { addToast } = useToast();
  const eventList = events ?? [];

  const closeEventModal = () => {
    setShowAddModal(false);
    setEditingEvent(null);
  };

  const handleEventSaved = () => {
    closeEventModal();
    refresh();
  };

  const refreshRsvps = async (eventId: number) => {
    const rsvpRes = await fetch(`/api/events/${eventId}/rsvps`);
    if (!rsvpRes.ok) {
      const data = await rsvpRes.json().catch(() => null) as { error?: string } | null;
      throw new Error(data?.error || "Failed to load RSVPs");
    }
    setRsvps(await rsvpRes.json());
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete event");
      }
      refresh();
      setDeleteConfirm(null);
      addToast("Event deleted successfully", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete event", "error");
      setDeleteConfirm(null);
    }
  };

  const viewRsvps = async (event: EventItem) => {
    setViewingRsvps(event);
    try {
      await refreshRsvps(event.id);
    } catch (err) {
      setRsvps([]);
      addToast(err instanceof Error ? err.message : "Failed to load RSVPs", "error");
    }
  };

  const addRsvp = async (eventId: number, guestName: string, guestEmail: string, partySize: number) => {
    const res = await fetch(`/api/events/${eventId}/rsvps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_name: guestName, guest_email: guestEmail, party_size: partySize }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(data?.error || "Failed to add RSVP");
    }
    await refreshRsvps(eventId);
    refresh();
  };

  const deleteRsvp = async (eventId: number, rsvpId: number) => {
    const res = await fetch(`/api/events/${eventId}/rsvps/${rsvpId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(data?.error || "Failed to remove RSVP");
    }
    await refreshRsvps(eventId);
    refresh();
  };

  if (loading)
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );

  if (error) return <ErrorMessage message={error} onRetry={refresh} />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">{eventList.length} events</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={16} />
          Create Event
        </button>
      </div>

      {eventList.length === 0 ? (
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
          {eventList.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onViewRsvps={viewRsvps}
              onEdit={setEditingEvent}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      )}

      {(showAddModal || editingEvent) && (
        <EventModal event={editingEvent} eventTypes={VALID_EVENT_TYPES} onClose={closeEventModal} onSaved={handleEventSaved} />
      )}

      {viewingRsvps && (
        <RsvpModal
          event={viewingRsvps}
          rsvps={rsvps}
          onClose={() => setViewingRsvps(null)}
          onAddRsvp={addRsvp}
          onDeleteRsvp={deleteRsvp}
        />
      )}

      {deleteConfirm !== null && (
        <ConfirmDialog
          title="Delete event"
          message="Delete this event? All RSVPs will also be removed."
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
