"use client";

import { useState } from "react";
import { ErrorMessage, LoadingCard } from "@/components/ui";
import { Plus, CalendarDays } from "lucide-react";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useMultiFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { Reservation, Table } from "@/lib/types";
import ReservationCalendar from "./components/ReservationCalendar";
import ReservationList from "./components/ReservationList";
import ReservationModal, { type ReservationFormValues } from "./components/ReservationModal";

type ReservationRecord = Pick<
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
  | "status"
  | "notes"
> & {
  table_name: string | null;
};

type TableOption = Pick<Table, "id" | "name" | "capacity">;

type StatusVariant = "success" | "warning" | "danger" | "info" | "default";

export default function ReservationsPage() {
  usePageTitle("Reservations");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showAll, setShowAll] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationRecord | null>(null);
  const [view, setView] = useState<"calendar" | "list">("list");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { addToast } = useToast();

  const resUrl = showAll ? "/api/reservations" : `/api/reservations?date=${selectedDate}`;
  const { data, loading, error, refresh } = useMultiFetch<{
    reservations: ReservationRecord[];
    tables: TableOption[];
  }>({
    reservations: resUrl,
    tables: "/api/tables",
  });

  const reservations = data?.reservations ?? [];
  const tables = data?.tables ?? [];

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete reservation");
      setDeleteConfirm(null);
      refresh();
      addToast("Reservation cancelled", "success");
    } catch {
      addToast("Failed to delete reservation", "error");
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update reservation");
      refresh();
    } catch {
      addToast("Failed to update reservation", "error");
    }
  };

  const statusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "confirmed": return "success" as const;
      case "pending": return "warning" as const;
      case "cancelled": return "danger" as const;
      case "completed": return "info" as const;
      case "no-show": return "danger" as const;
      default: return "default" as const;
    }
  };

  const handleSaveReservation = async (
    form: ReservationFormValues,
    reservationId: number | null,
  ) => {
    const url = reservationId ? `/api/reservations/${reservationId}` : "/api/reservations";
    const method = reservationId ? "PUT" : "POST";
    const body = { ...form, table_id: form.table_id || null };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to save");
    setShowAddModal(false);
    setEditingReservation(null);
    refresh();
  };

  if (loading)
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-500 mt-1">{reservations.length} reservations</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => {
                setView("calendar");
                setShowAll(false);
              }}
              aria-pressed={view === "calendar"}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "calendar" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              <CalendarDays size={14} className="inline mr-1" />
              Calendar
            </button>
            <button
              onClick={() => {
                setView("list");
                setShowAll(false);
              }}
              aria-pressed={view === "list"}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus size={16} />
            New Reservation
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setShowAll(false);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().slice(0, 10));
              setShowAll(false);
            }}
            className="px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          >
            Today
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded"
            />
            Show all dates
          </label>
        </div>
      </div>

      {view === "calendar" && (
        <ReservationCalendar
          reservations={reservations}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setShowAll(false);
          }}
          statusVariant={statusVariant}
        />
      )}

      {view === "list" && (
        <ReservationList
          reservations={reservations}
          onNewReservation={() => setShowAddModal(true)}
          onEdit={setEditingReservation}
          onDelete={setDeleteConfirm}
          onStatusChange={handleStatusChange}
          statusVariant={statusVariant}
        />
      )}

      {(showAddModal || editingReservation) && (
        <ReservationModal
          reservation={editingReservation}
          tables={tables}
          onClose={() => {
            setShowAddModal(false);
            setEditingReservation(null);
          }}
          onSubmit={handleSaveReservation}
        />
      )}

      {deleteConfirm !== null && (
        <ConfirmDialog
          title="Cancel reservation"
          message="Cancel this reservation? This action cannot be undone."
          confirmLabel="Cancel reservation"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
