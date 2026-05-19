"use client";

import { useId, useMemo, useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { ErrorMessage, LoadingCard } from "@/components/ui";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useMultiFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import { VALID_RESERVATION_STATUSES } from "@/lib/constants";
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

const EMPTY_RESERVATIONS: ReservationRecord[] = [];
const EMPTY_TABLES: TableOption[] = [];

export default function ReservationsPage() {
  usePageTitle("Reservations");
  const filterDateId = useId();
  const showAllId = useId();
  const searchId = useId();
  const statusId = useId();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showAll, setShowAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationRecord | null>(null);
  const [view, setView] = useState<"calendar" | "list">("list");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { addToast } = useToast();

  const resUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", showAll ? "500" : "150");
    if (!showAll) params.set("date", selectedDate);
    if (statusFilter) params.set("status", statusFilter);
    return `/api/reservations?${params.toString()}`;
  }, [selectedDate, showAll, statusFilter]);

  const { data, loading, error, refresh } = useMultiFetch<{
    reservations: ReservationRecord[];
    tables: TableOption[];
  }>({
    reservations: resUrl,
    tables: "/api/tables",
  });

  const reservations = data?.reservations ?? EMPTY_RESERVATIONS;
  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reservations;
    return reservations.filter((reservation) =>
      [
        reservation.guest_name,
        reservation.guest_email,
        reservation.guest_phone,
        reservation.table_name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [reservations, search]);
  const tables = data?.tables ?? EMPTY_TABLES;
  const hasActiveFilters = showAll || selectedDate !== today || statusFilter !== "" || search.trim() !== "";

  const resetAllFilters = () => {
    setSelectedDate(today);
    setShowAll(false);
    setStatusFilter("");
    setSearch("");
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete reservation");
      }
      setDeleteConfirm(null);
      refresh();
      addToast("Reservation cancelled", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to delete reservation", "error");
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
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to update reservation");
      }
      refresh();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to update reservation", "error");
    }
  };

  const statusVariant = (status: string): StatusVariant => {
    switch (status) {
      case "confirmed":
        return "success" as const;
      case "pending":
        return "warning" as const;
      case "cancelled":
        return "danger" as const;
      case "completed":
        return "info" as const;
      case "no-show":
        return "danger" as const;
      default:
        return "default" as const;
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
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Failed to save reservation");
    }
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
          <p className="text-gray-500 mt-1">{filteredReservations.length} reservations</p>
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

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor={filterDateId} className="sr-only">Filter reservations by date</label>
          <input
            id={filterDateId}
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
              setSelectedDate(today);
              setShowAll(false);
            }}
            className="px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          >
            Today
          </button>
          <label htmlFor={showAllId} className="flex items-center gap-2 text-sm text-gray-600">
            <input
              id={showAllId}
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded"
            />
            Show all dates
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.5fr_0.8fr_auto]">
          <div>
            <label htmlFor={searchId} className="mb-1 block text-sm font-medium text-gray-700">
              Search guests
            </label>
            <input
              id={searchId}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by guest, email, phone, or table"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor={statusId} className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id={statusId}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            >
              <option value="">All statuses</option>
              {VALID_RESERVATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            disabled={!hasActiveFilters}
            className="h-fit self-end rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset all filters
          </button>
        </div>
      </div>

      {view === "calendar" && (
        <ReservationCalendar
          reservations={filteredReservations}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setShowAll(false);
          }}
          statusVariant={statusVariant}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetAllFilters}
        />
      )}

      {view === "list" && (
        <ReservationList
          reservations={filteredReservations}
          onNewReservation={() => setShowAddModal(true)}
          onEdit={setEditingReservation}
          onDelete={setDeleteConfirm}
          onStatusChange={handleStatusChange}
          statusVariant={statusVariant}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetAllFilters}
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
