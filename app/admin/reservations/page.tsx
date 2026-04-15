"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorMessage, EmptyState, Badge } from "@/components/ui";
import { Plus, X, CalendarDays, Edit2, Trash2 } from "lucide-react";

interface Reservation {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  party_size: number;
  table_id: number | null;
  table_name: string | null;
  reservation_date: string;
  reservation_time: string;
  duration_minutes: number;
  status: string;
  notes: string;
}

interface Table {
  id: number;
  name: string;
  capacity: number;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAll, setShowAll] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [view, setView] = useState<"calendar" | "list">("list");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError(null);
        const params = showAll ? "" : `?date=${selectedDate}`;
        const [resRes, tablesRes] = await Promise.all([
          fetch(`/api/reservations${params}`),
          fetch("/api/tables"),
        ]);
        if (!resRes.ok || !tablesRes.ok) throw new Error("Failed to load data");
        if (!cancelled) {
          setReservations(await resRes.json());
          setTables(await tablesRes.json());
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedDate, showAll, refreshKey]);

  const handleDelete = async (id: number) => {
    if (!confirm("Cancel this reservation?")) return;
    try {
      await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to delete reservation");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to update reservation");
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "success" as const;
      case "pending": return "warning" as const;
      case "cancelled": return "danger" as const;
      case "completed": return "info" as const;
      case "no-show": return "danger" as const;
      default: return "default" as const;
    }
  };

  // Calendar data
  const getWeekDates = () => {
    const date = new Date(selectedDate + "T12:00:00");
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={() => setRefreshKey((k) => k + 1)} />;

  const weekDates = getWeekDates();

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
              onClick={() => { setView("calendar"); setShowAll(false); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "calendar" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              <CalendarDays size={14} className="inline mr-1" />
              Calendar
            </button>
            <button
              onClick={() => { setView("list"); setShowAll(false); }}
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

      {/* Date Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setShowAll(false); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={() => { setSelectedDate(new Date().toISOString().split("T")[0]); setShowAll(false); }}
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

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDates.map((date) => {
              const isToday = date === new Date().toISOString().split("T")[0];
              const isSelected = date === selectedDate;
              const dateReservations = reservations.filter((r) => r.reservation_date === date);
              return (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setShowAll(false); }}
                  className={`p-3 text-center border-r last:border-r-0 transition-colors ${
                    isSelected ? "bg-violet-50" : "hover:bg-gray-50"
                  }`}
                >
                  <p className="text-xs text-gray-500">
                    {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className={`text-lg font-semibold ${isToday ? "text-violet-600" : "text-gray-900"}`}>
                    {new Date(date + "T12:00:00").getDate()}
                  </p>
                  {dateReservations.length > 0 && (
                    <div className="mt-1">
                      <Badge variant="info">{dateReservations.length}</Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            {reservations.filter((r) => r.reservation_date === selectedDate).length === 0 ? (
              <p className="text-sm text-gray-400">No reservations for this date</p>
            ) : (
              <div className="space-y-2">
                {reservations
                  .filter((r) => r.reservation_date === selectedDate)
                  .map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{r.reservation_time} — {r.guest_name}</p>
                        <p className="text-xs text-gray-500">
                          {r.party_size} guests · {r.table_name || "No table"} · {r.duration_minutes}min
                        </p>
                      </div>
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        reservations.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No reservations"
            description="Create a new reservation or select a different date."
            action={
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700"
              >
                New Reservation
              </button>
            }
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Guest</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date & Time</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Party</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Table</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.guest_name}</p>
                      <p className="text-xs text-gray-500">{r.guest_email || r.guest_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{new Date(r.reservation_date + "T12:00:00").toLocaleDateString()}</p>
                      <p className="text-xs">{r.reservation_time}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{r.party_size}</td>
                    <td className="px-4 py-3 text-gray-600">{r.table_name || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "pending" && (
                          <button
                            onClick={() => handleStatusChange(r.id, "confirmed")}
                            className="px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        {r.status === "confirmed" && (
                          <button
                            onClick={() => handleStatusChange(r.id, "no-show")}
                            className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          >
                            No-show
                          </button>
                        )}
                        <button
                          onClick={() => setEditingReservation(r)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingReservation) && (
        <ReservationModal
          reservation={editingReservation}
          tables={tables}
          onClose={() => {
            setShowAddModal(false);
            setEditingReservation(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setEditingReservation(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function ReservationModal({
  reservation,
  tables,
  onClose,
  onSaved,
}: {
  reservation: Reservation | null;
  tables: Table[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    guest_name: reservation?.guest_name || "",
    guest_email: reservation?.guest_email || "",
    guest_phone: reservation?.guest_phone || "",
    party_size: reservation?.party_size || 2,
    table_id: reservation?.table_id || "",
    reservation_date: reservation?.reservation_date || new Date().toISOString().split("T")[0],
    reservation_time: reservation?.reservation_time || "18:00",
    duration_minutes: reservation?.duration_minutes || 120,
    notes: reservation?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = reservation ? `/api/reservations/${reservation.id}` : "/api/reservations";
      const method = reservation ? "PUT" : "POST";
      const body = { ...form, table_id: form.table_id || null };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
    } catch {
      alert("Failed to save reservation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{reservation ? "Edit Reservation" : "New Reservation"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.guest_email}
                onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-3 gap-4">
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
                  <option key={t.id} value={t.id}>{t.name} ({t.capacity} seats)</option>
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
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : reservation ? "Update" : "Create Reservation"}
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
