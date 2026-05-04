"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { EventItem, EventType, EventStatus } from "@/lib/types";
import { VALID_EVENT_STATUSES } from "@/lib/constants";

interface EventModalProps {
  event: EventItem | null;
  eventTypes: readonly string[];
  onClose: () => void;
  onSaved: () => void;
}

export default function EventModal({ event, eventTypes, onClose, onSaved }: EventModalProps) {
  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    event_date: event?.event_date || new Date().toISOString().slice(0, 10),
    start_time: event?.start_time || "18:00",
    end_time: event?.end_time || "22:00",
    capacity: event?.capacity || 20,
    event_type: event?.event_type || "Game Night",
    status: event?.status || "upcoming",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (form.end_time && form.start_time && form.end_time <= form.start_time) {
      errs.end_time = "End time must be after start time";
    }
    if (form.capacity < 1) errs.capacity = "Capacity must be at least 1";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSaving(true);
    try {
      const url = event ? `/api/events/${event.id}` : "/api/events";
      const method = event ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "Failed to save event");
      }
      onSaved();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save event", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={event ? "Edit Event" : "Create Event"} onClose={onClose}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              onChange={(e) => setForm({ ...form, event_type: e.target.value as EventType })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              onChange={(e) => {
                setForm({ ...form, end_time: e.target.value });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.end_time;
                  return next;
                });
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.end_time ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.end_time && <p className="mt-1 text-xs text-red-600">{errors.end_time}</p>}
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
              onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {VALID_EVENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : event ? "Update Event" : "Create Event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
