"use client";

import { CalendarClock, CreditCard, MapPinned, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatElapsed } from "@/lib/date-utils";
import type { Reservation, Session, Table } from "@/lib/types";

interface FloorMapProps {
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
      | "duration_minutes"
      | "status"
    >
  >;
  selectedTableId: number | null;
  onSelectTable: (tableId: number) => void;
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

function tableClasses(table: Table, isSelected: boolean) {
  const base =
    "absolute -translate-x-1/2 -translate-y-1/2 border p-3 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";
  const shape =
    table.shape === "circle"
      ? "h-24 w-24 rounded-full"
      : table.shape === "square"
        ? "h-24 w-24 rounded-2xl"
        : "h-20 w-28 rounded-2xl";
  const statusTone =
    table.status === "maintenance"
      ? "border-gray-300 bg-gray-100 text-gray-500"
      : table.status === "occupied"
        ? "border-violet-200 bg-violet-50 text-violet-900 hover:-translate-y-[calc(50%+2px)]"
        : table.status === "reserved"
          ? "border-amber-200 bg-amber-50 text-amber-900 hover:-translate-y-[calc(50%+2px)]"
          : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:-translate-y-[calc(50%+2px)]";
  const selected = isSelected ? "ring-2 ring-violet-500" : "";
  return `${base} ${shape} ${statusTone} ${selected}`;
}

export default function FloorMap({
  tables,
  sessions,
  reservations,
  selectedTableId,
  onSelectTable,
  onSelectSession,
  onStartCheckIn,
  onEditTable,
}: FloorMapProps) {
  const sessionByTableId = new Map(sessions.map((session) => [session.table_id, session]));
  const reservationByTableId = new Map(
    reservations
      .filter(
        (reservation) =>
          reservation.table_id !== null &&
          (reservation.status === "confirmed" || reservation.status === "pending"),
      )
      .map((reservation) => [reservation.table_id as number, reservation]),
  );

  const maxX = tables.reduce((largest, table) => Math.max(largest, table.x_position), 0);
  const maxY = tables.reduce((largest, table) => Math.max(largest, table.y_position), 0);
  const mapWidth = Math.max(760, maxX + 140);
  const mapHeight = Math.max(480, maxY + 140);
  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? tables[0] ?? null;
  const selectedSession = selectedTable ? sessionByTableId.get(selectedTable.id) : undefined;
  const selectedReservation = selectedTable
    ? reservationByTableId.get(selectedTable.id)
    : undefined;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Floor plan</h2>
            <p className="text-sm text-gray-500">
              Table placement now uses the stored `x_position`, `y_position`, and `shape`
              fields from the table model.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <Legend label="Available" tone="bg-emerald-100 text-emerald-800" />
            <Legend label="Occupied" tone="bg-violet-100 text-violet-800" />
            <Legend label="Reserved" tone="bg-amber-100 text-amber-800" />
            <Legend label="Maintenance" tone="bg-gray-200 text-gray-700" />
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div
            className="relative rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white"
            style={{ width: mapWidth, height: mapHeight }}
          >
            <div className="absolute inset-6 rounded-[28px] border border-white/80 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.08),_transparent_30%)]" />
            {tables.map((table) => {
              const tableSession = sessionByTableId.get(table.id);
              const isSelected = selectedTable?.id === table.id;
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => onSelectTable(table.id)}
                  aria-pressed={isSelected}
                  aria-label={`${table.name} — ${table.status}${tableSession ? `, ${tableSession.party_name}, ${tableSession.party_size} guests` : ""}`}
                  className={tableClasses(table, isSelected)}
                  style={{ left: table.x_position, top: table.y_position }}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <p className="text-sm font-semibold">{table.name}</p>
                      <p className="text-xs opacity-80">{table.section}</p>
                    </div>
                    <div className="text-xs opacity-90">
                      {tableSession ? (
                        <>
                          <p>{tableSession.party_name}</p>
                          <p>{tableSession.party_size} guests</p>
                        </>
                      ) : (
                        <p>{table.capacity} seats</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTable && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTable.name}</h3>
                <Badge variant={statusVariant(selectedTable.status)}>
                  {selectedTable.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {selectedTable.section} · {selectedTable.capacity} seats · {selectedTable.shape}
                {" "}shape · x {selectedTable.x_position} · y {selectedTable.y_position}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEditTable(selectedTable)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Manage table
            </button>
          </div>

          {selectedSession ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <InfoCard
                icon={<Users size={16} />}
                title={selectedSession.party_name}
                description={`${selectedSession.party_size} guests · ${formatElapsed(selectedSession.started_at)} elapsed`}
              />
              <InfoCard
                icon={<CreditCard size={16} />}
                title={`$${selectedSession.running_total.toFixed(2)}`}
                description={`${selectedSession.active_games} active games · ${selectedSession.rate_type === "per_person" ? "Per guest" : "Per table"}`}
              />
            </div>
          ) : selectedReservation ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <CalendarClock size={18} className="mt-0.5" />
                <div>
                  <p className="font-medium">
                    Reserved for {selectedReservation.guest_name} at {selectedReservation.reservation_time}
                  </p>
                  <p className="mt-1 text-amber-800/80">
                    {selectedReservation.party_size} guests · {selectedReservation.duration_minutes}
                    min hold window.
                  </p>
                </div>
              </div>
            </div>
          ) : selectedTable.status === "maintenance" ? (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <Wrench size={18} className="mt-0.5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">This table is blocked for maintenance.</p>
                  <p className="mt-1 text-gray-500">
                    Use table management to return it to service when it is ready.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-start gap-3">
                <MapPinned size={18} className="mt-0.5" />
                <div>
                  <p className="font-medium">Ready for the next party.</p>
                  <p className="mt-1 text-emerald-800/80">
                    Start a check-in with this table preselected to keep floor operations moving.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {selectedSession ? (
              <button
                type="button"
                onClick={() => onSelectSession(selectedSession)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
              >
                Open billing summary
              </button>
            ) : selectedTable.status === "available" ? (
              <button
                type="button"
                onClick={() => onStartCheckIn(selectedTable.id)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Seat next party
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onEditTable(selectedTable)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Edit layout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">{icon}<span>Session detail</span></div>
      <p className="mt-3 text-lg font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function Legend({ label, tone }: { label: string; tone: string }) {
  return <span className={`rounded-full px-2.5 py-1 font-medium ${tone}`}>{label}</span>;
}
