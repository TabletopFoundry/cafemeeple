"use client";

import { Badge, EmptyState } from "@/components/ui";
import type { Reservation } from "@/lib/types";
import { Edit2, Trash2 } from "lucide-react";

type ListReservation = Pick<
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

type StatusVariant = "success" | "warning" | "danger" | "info" | "default";

interface ReservationListProps {
  reservations: ListReservation[];
  onNewReservation: () => void;
  onEdit: (reservation: ListReservation) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  statusVariant: (status: string) => StatusVariant;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export default function ReservationList({
  reservations,
  onNewReservation,
  onEdit,
  onDelete,
  onStatusChange,
  statusVariant,
  hasActiveFilters,
  onResetFilters,
}: ReservationListProps) {
  if (reservations.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title={hasActiveFilters ? "No reservations match the current filters" : "No reservations"}
        description={
          hasActiveFilters
            ? "Reset the date, status, or guest search filters to bring reservations back into view."
            : "Create a new reservation or select a different date."
        }
        action={hasActiveFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700"
          >
            Reset filters
          </button>
        ) : (
          <button
            onClick={onNewReservation}
            className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700"
          >
            New Reservation
          </button>
        )}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Guest</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Date &amp; Time</th>
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
                      onClick={() => onStatusChange(r.id, "confirmed")}
                      className="px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                  {r.status === "confirmed" && (
                    <button
                      onClick={() => onStatusChange(r.id, "no-show")}
                      className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition-colors"
                    >
                      No-show
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(r)}
                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    aria-label={`Edit reservation for ${r.guest_name}`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(r.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    aria-label={`Delete reservation for ${r.guest_name}`}
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
  );
}
