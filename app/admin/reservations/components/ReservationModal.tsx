"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import type { Reservation, Table } from "@/lib/types";

type ModalReservation = Pick<
  Reservation,
  | "id"
  | "guest_name"
  | "guest_email"
  | "guest_phone"
  | "party_size"
  | "table_id"
  | "reservation_date"
  | "reservation_time"
  | "duration_minutes"
  | "notes"
>;

type TableOption = Pick<Table, "id" | "name" | "capacity">;

export interface ReservationFormValues {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  party_size: number;
  table_id: number | string;
  reservation_date: string;
  reservation_time: string;
  duration_minutes: number;
  notes: string;
}

interface ReservationModalProps {
  reservation: ModalReservation | null;
  tables: TableOption[];
  onClose: () => void;
  onSubmit: (form: ReservationFormValues, reservationId: number | null) => Promise<void>;
}

export default function ReservationModal({
  reservation,
  tables,
  onClose,
  onSubmit,
}: ReservationModalProps) {
  const [form, setForm] = useState<ReservationFormValues>({
    guest_name: reservation?.guest_name || "",
    guest_email: reservation?.guest_email || "",
    guest_phone: reservation?.guest_phone || "",
    party_size: reservation?.party_size || 2,
    table_id: reservation?.table_id ?? "",
    reservation_date: reservation?.reservation_date ?? new Date().toISOString().slice(0, 10),
    reservation_time: reservation?.reservation_time ?? "18:00",
    duration_minutes: reservation?.duration_minutes || 120,
    notes: reservation?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.guest_name.trim()) errs.guest_name = "Guest name is required";
    if (form.guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guest_email)) {
      errs.guest_email = "Invalid email format";
    }
    if (form.party_size < 1) errs.party_size = "Party size must be at least 1";
    if (form.duration_minutes < 30) errs.duration_minutes = "Duration must be at least 30 minutes";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSaving(true);
    try {
      await onSubmit(form, reservation ? reservation.id : null);
    } catch {
      addToast("Failed to save reservation", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={reservation ? "Edit Reservation" : "New Reservation"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name *</label>
          <input
            type="text"
            required
            value={form.guest_name}
            onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.guest_email}
              onChange={(e) => {
                setForm({ ...form, guest_email: e.target.value });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.guest_email;
                  return next;
                });
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.guest_email ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.guest_email && <p className="mt-1 text-xs text-red-600">{errors.guest_email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.guest_phone}
              onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={form.reservation_date}
              onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
            <input
              type="time"
              required
              value={form.reservation_time}
              onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
            <input
              type="number"
              min={1}
              value={form.party_size}
              onChange={(e) => setForm({ ...form, party_size: parseInt(e.target.value) || 2 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
            <input
              type="number"
              min={30}
              step={30}
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 120 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
            <select
              value={form.table_id}
              onChange={(e) => setForm({ ...form, table_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Auto-assign</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.capacity} seats)
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Special requests, birthday, etc."
          />
        </div>
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
            {saving ? "Saving..." : reservation ? "Update" : "Create Reservation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
