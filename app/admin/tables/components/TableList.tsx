"use client";

import { Badge } from "@/components/ui";
import { formatElapsed } from "@/lib/date-utils";
import type { Reservation, Session, Table } from "@/lib/types";

interface TableListProps {
  tables: Table[];
  sessions: Session[];
  reservations: Array<
    Pick<
      Reservation,
      | "id"
      | "guest_name"
      | "party_size"
      | "table_id"
      | "reservation_time"
      | "status"
    >
  >;
  onSelectSession: (session: Session) => void;
  onStartCheckIn: (tableId: number) => void;
  onEditTable: (table: Table) => void;
}

function statusVariant(status: Table["status"]) {
  switch (status) {
    case "available":
      return "success" as const;
    case "occupied":
      return "info" as const;
    case "reserved":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export default function TableList({
  tables,
  sessions,
  reservations,
  onSelectSession,
  onStartCheckIn,
  onEditTable,
}: TableListProps) {
  const getSessionForTable = (tableId: number) =>
    sessions.find((session) => session.table_id === tableId);
  const getReservationForTable = (tableId: number) =>
    reservations.find(
      (reservation) =>
        reservation.table_id === tableId &&
        (reservation.status === "confirmed" || reservation.status === "pending"),
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Table</th>
              <th className="px-4 py-3 font-medium">Occupancy</th>
              <th className="px-4 py-3 font-medium">Elapsed / ETA</th>
              <th className="px-4 py-3 font-medium">Billing</th>
              <th className="px-4 py-3 font-medium">Games</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tables.map((table) => {
              const session = getSessionForTable(table.id);
              const reservation = getReservationForTable(table.id);
              return (
                <tr key={table.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{table.name}</p>
                      <p className="text-xs text-gray-500">
                        {table.section} · {table.capacity} seats · {table.shape}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {session ? (
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.party_name} ({session.party_size})
                        </p>
                        <p className="text-xs text-gray-500">Live party</p>
                      </div>
                    ) : reservation ? (
                      <div>
                        <p className="font-medium text-gray-900">
                          {reservation.guest_name} ({reservation.party_size})
                        </p>
                        <p className="text-xs text-gray-500">Reserved guest</p>
                      </div>
                    ) : (
                      <Badge variant={statusVariant(table.status)}>{table.status}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {session ? (
                      formatElapsed(session.started_at)
                    ) : reservation ? (
                      `Reserved for ${reservation.reservation_time}`
                    ) : (
                      "Ready now"
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {session
                      ? `$${session.running_total.toFixed(2)} · ${session.rate_type === "per_person" ? "person" : "table"}`
                      : table.status === "maintenance"
                        ? "Blocked"
                        : "—"}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{session ? session.active_games : "—"}</td>
                  <td className="px-4 py-4 text-right">
                    {session ? (
                      <button
                        type="button"
                        onClick={() => onSelectSession(session)}
                        className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                      >
                        Billing summary
                      </button>
                    ) : table.status === "available" ? (
                      <button
                        type="button"
                        onClick={() => onStartCheckIn(table.id)}
                        className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Check in party
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEditTable(table)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Manage table
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
