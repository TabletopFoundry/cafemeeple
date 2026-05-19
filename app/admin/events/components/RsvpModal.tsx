"use client";

import { useId, useState } from "react";
import { Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { Badge } from "@/components/ui";
import { MAX_TEXT_LENGTHS } from "@/lib/constants";
import { EventItem, Rsvp } from "@/lib/types";

interface RsvpModalProps {
  event: EventItem;
  rsvps: Rsvp[];
  loading: boolean;
  onClose: () => void;
  onAddRsvp: (eventId: number, name: string, email: string, partySize: number) => Promise<void>;
  onDeleteRsvp: (eventId: number, rsvpId: number) => Promise<void>;
}

export default function RsvpModal({ event, rsvps, loading, onClose, onAddRsvp, onDeleteRsvp }: RsvpModalProps) {
  const nameId = useId();
  const emailId = useId();
  const partySizeId = useId();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const handleAdd = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    if (partySize < 1) errs.partySize = "Party size must be at least 1";
    if (!loading && partySize > remainingSeats) {
      errs.partySize = remainingSeats === 0
        ? "This event is already at capacity"
        : `Only ${remainingSeats} seat${remainingSeats === 1 ? "" : "s"} remaining`;
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await onAddRsvp(event.id, name, email, partySize);
      setName("");
      setEmail("");
      setPartySize(1);
      setShowAdd(false);
      setErrors({});
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to add RSVP", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rsvpId: number) => {
    setRemovingId(rsvpId);
    try {
      await onDeleteRsvp(event.id, rsvpId);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to remove RSVP", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const totalAttendees = rsvps.reduce((sum, rsvp) => sum + rsvp.party_size, 0);
  const remainingSeats = Math.max(event.capacity - totalAttendees, 0);

  return (
    <Modal title={event.title} subtitle={`${totalAttendees} / ${event.capacity} attendees`} onClose={onClose} size="sm">
      <div className="p-6">
        <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <p className="font-medium text-gray-900">
            {loading
              ? "Loading attendee totals..."
              : remainingSeats === 0
                ? "This event is currently full."
                : `${remainingSeats} seat${remainingSeats === 1 ? "" : "s"} remaining.`}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {loading ? "Refreshing RSVPs for this event." : `${totalAttendees} of ${event.capacity} seats are reserved.`}
          </p>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-sm text-gray-700">RSVPs ({rsvps.length})</h3>
          <button type="button" onClick={() => setShowAdd(!showAdd)} className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            {showAdd ? "Cancel" : "+ Add RSVP"}
          </button>
        </div>

        {showAdd && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4 space-y-3">
            <div>
              <label htmlFor={nameId} className="mb-1 block text-sm font-medium text-gray-700">Guest name *</label>
              <input
                id={nameId}
                type="text"
                maxLength={MAX_TEXT_LENGTHS.guestName}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.name ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor={emailId} className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                id={emailId}
                type="email"
                maxLength={MAX_TEXT_LENGTHS.guestEmail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.email ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div className="flex gap-2 items-end">
              <div className="w-24">
                <label htmlFor={partySizeId} className="mb-1 block text-sm font-medium text-gray-700">Party size</label>
                <input
                  id={partySizeId}
                  type="number"
                  min={1}
                  value={partySize}
                  onChange={(e) => {
                    setPartySize(parseInt(e.target.value) || 1);
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.partySize;
                      return next;
                    });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.partySize ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.partySize && <p className="mt-1 text-xs text-red-600">{errors.partySize}</p>}
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || loading}
                className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : saving ? "Adding..." : "Add RSVP"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Loading RSVPs...
          </div>
        ) : rsvps.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No RSVPs yet</p>
        ) : (
          <div className="space-y-2">
            {rsvps.map((rsvp) => (
              <div key={rsvp.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{rsvp.guest_name}</p>
                  <p className="text-xs text-gray-500">{rsvp.guest_email || "No email"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {rsvp.party_size} guest{rsvp.party_size > 1 ? "s" : ""}
                  </span>
                  <Badge variant={rsvp.status === "cancelled" ? "danger" : "success"}>{rsvp.status}</Badge>
                  <button
                    type="button"
                    onClick={() => handleDelete(rsvp.id)}
                    disabled={removingId === rsvp.id}
                    aria-label={`Remove RSVP for ${rsvp.guest_name}`}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
