"use client";

import { useId, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { DEFAULT_RESERVATION_DURATION, MAX_TEXT_LENGTHS } from "@/lib/constants";
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

type TableOption = Pick<Table, "id" | "name" | "capacity" | "section" | "status">;

function tableStateLabel(status: Table["status"]) {
  switch (status) {
    case "occupied":
      return "In service now";
    case "reserved":
      return "Reserved soon";
    case "maintenance":
      return "Maintenance";
    default:
      return "Ready now";
  }
}

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
  const guestNameId = useId();
  const guestEmailId = useId();
  const guestPhoneId = useId();
  const dateId = useId();
  const timeId = useId();
  const partySizeId = useId();
  const durationId = useId();
  const tableId = useId();
  const notesId = useId();
  const [form, setForm] = useState<ReservationFormValues>({
    guest_name: reservation?.guest_name || "",
    guest_email: reservation?.guest_email || "",
    guest_phone: reservation?.guest_phone || "",
    party_size: reservation?.party_size || 2,
    table_id: reservation?.table_id ?? "",
    reservation_date: reservation?.reservation_date ?? new Date().toISOString().slice(0, 10),
    reservation_time: reservation?.reservation_time ?? "18:00",
    duration_minutes: reservation?.duration_minutes || DEFAULT_RESERVATION_DURATION,
    notes: reservation?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();
  const selectedTableId = typeof form.table_id === "string" ? Number(form.table_id || 0) : form.table_id;
  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId, tables],
  );
  const orderedTables = useMemo(() => {
    const statusOrder: Record<Table["status"], number> = {
      available: 0,
      occupied: 1,
      reserved: 2,
      maintenance: 3,
    };

    return [...tables].sort(
      (left, right) =>
        statusOrder[left.status] - statusOrder[right.status] || left.name.localeCompare(right.name),
    );
  }, [tables]);

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.guest_name.trim()) errs.guest_name = "Guest name is required";
    if (form.guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guest_email)) {
      errs.guest_email = "Invalid email format";
    }
    if (form.party_size < 1) errs.party_size = "Party size must be at least 1";
    if (form.duration_minutes < 30) errs.duration_minutes = "Duration must be at least 30 minutes";
    if (selectedTable?.status === "maintenance") {
      errs.table_id = `${selectedTable.name} is under maintenance. Choose another table or leave this reservation on auto-assign.`;
    }
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
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save reservation", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={reservation ? "Edit Reservation" : "New Reservation"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor={guestNameId} className="block text-sm font-medium text-gray-700 mb-1">Guest Name *</label>
          <input
            id={guestNameId}
            type="text"
            required
            maxLength={MAX_TEXT_LENGTHS.guestName}
            value={form.guest_name}
            onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={guestEmailId} className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id={guestEmailId}
              type="email"
              maxLength={MAX_TEXT_LENGTHS.guestEmail}
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
            <label htmlFor={guestPhoneId} className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              id={guestPhoneId}
              type="tel"
              maxLength={MAX_TEXT_LENGTHS.guestPhone}
              value={form.guest_phone}
              onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={dateId} className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              id={dateId}
              type="date"
              required
              value={form.reservation_date}
              onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label htmlFor={timeId} className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
            <input
              id={timeId}
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
            <label htmlFor={partySizeId} className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
            <input
              id={partySizeId}
              type="number"
              min={1}
              value={form.party_size}
              onChange={(e) => setForm({ ...form, party_size: parseInt(e.target.value) || 2 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label htmlFor={durationId} className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
            <input
              id={durationId}
              type="number"
              min={30}
              step={30}
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || DEFAULT_RESERVATION_DURATION })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label htmlFor={tableId} className="block text-sm font-medium text-gray-700 mb-1">Table</label>
            <select
              id={tableId}
              value={form.table_id}
              onChange={(e) => {
                setForm({ ...form, table_id: e.target.value });
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.table_id;
                  return next;
                });
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.table_id ? "border-red-400" : "border-gray-200"}`}
            >
              <option value="">Auto-assign</option>
              {orderedTables.map((table) => {
                const isCurrentSelection = table.id === selectedTableId;
                return (
                  <option
                    key={table.id}
                    value={table.id}
                    disabled={table.status === "maintenance" && !isCurrentSelection}
                  >
                    {table.name} · {table.capacity} seats · {table.section} · {tableStateLabel(table.status)}
                  </option>
                );
              })}
            </select>
            <p
              className={`mt-1 text-xs ${
                selectedTable?.status === "maintenance"
                  ? "text-red-600"
                  : selectedTable && selectedTable.status !== "available"
                    ? "text-amber-700"
                    : "text-gray-500"
              }`}
            >
              {selectedTable
                ? selectedTable.status === "maintenance"
                  ? `${selectedTable.name} is currently under maintenance and cannot take a manual reservation.`
                  : selectedTable.status === "available"
                    ? `${selectedTable.name} is ready right now. Leave the reservation on Auto-assign if you do not need to lock a specific table yet.`
                    : `${selectedTable.name} is ${tableStateLabel(selectedTable.status).toLowerCase()}. Keep it only if you intentionally want to hold that table.`
                : "Leave this on Auto-assign to keep the booking flexible. Live table states are shown here for the current floor."}
            </p>
            {errors.table_id && <p className="mt-1 text-xs text-red-600">{errors.table_id}</p>}
          </div>
        </div>
        <div>
          <label htmlFor={notesId} className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            id={notesId}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            maxLength={MAX_TEXT_LENGTHS.reservationNotes}
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
