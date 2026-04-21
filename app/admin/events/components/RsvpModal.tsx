"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Badge } from "@/components/ui";
import { EventItem, Rsvp } from "@/lib/types";

interface RsvpModalProps {
  event: EventItem;
  rsvps: Rsvp[];
  onClose: () => void;
  onAddRsvp: (eventId: number, name: string, email: string, partySize: number) => void | Promise<void>;
}

export default function RsvpModal({ event, rsvps, onClose, onAddRsvp }: RsvpModalProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAdd = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
    if (partySize < 1) errs.partySize = "Party size must be at least 1";
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
    } finally {
      setSaving(false);
    }
  };

  const totalAttendees = rsvps.reduce((sum, rsvp) => sum + rsvp.party_size, 0);

  return (
    <Modal title={event.title} subtitle={`${totalAttendees} / ${event.capacity} attendees`} onClose={onClose} size="sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-sm text-gray-700">RSVPs ({rsvps.length})</h3>
          <button onClick={() => setShowAdd(!showAdd)} className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            {showAdd ? "Cancel" : "+ Add RSVP"}
          </button>
        </div>

        {showAdd && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4 space-y-3">
            <input
              type="text"
              placeholder="Guest name *"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => { const next = { ...prev }; delete next.name; return next; });
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.name ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => { const next = { ...prev }; delete next.email; return next; });
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.email ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
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
                disabled={saving}
                className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add RSVP"}
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
                  <span className="text-xs text-gray-500">
                    {rsvp.party_size} guest{rsvp.party_size > 1 ? "s" : ""}
                  </span>
                  <Badge variant="success">{rsvp.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
