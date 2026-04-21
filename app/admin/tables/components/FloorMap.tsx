"use client";

import { Clock3, CreditCard, Users } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatElapsed } from "@/lib/date-utils";
import type { Session, Table } from "@/lib/types";

interface FloorMapProps {
  tables: Table[];
  sessions: Session[];
  onSelectSession: (session: Session) => void;
  onStartCheckIn: () => void;
}

export default function FloorMap({
  tables,
  sessions,
  onSelectSession,
  onStartCheckIn,
}: FloorMapProps) {
  const getSessionForTable = (tableId: number) =>
    sessions.find((session) => session.table_id === tableId);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {tables.map((table) => {
          const session = getSessionForTable(table.id);
          return (
            <button
              key={table.id}
              onClick={() => {
                if (session) {
                  onSelectSession(session);
                } else if (table.status === "available") {
                  onStartCheckIn();
                }
              }}
              aria-label={`${table.name} — ${table.status}${session ? `, ${session.party_name}, ${session.party_size} guests` : ""}`}
              className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                table.status === "occupied"
                  ? "border-violet-200 bg-violet-50"
                  : table.status === "reserved"
                    ? "border-amber-200 bg-amber-50"
                    : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-gray-900">{table.name}</p>
                <Badge
                  variant={
                    table.status === "occupied"
                      ? "info"
                      : table.status === "reserved"
                        ? "warning"
                        : "success"
                  }
                >
                  {table.status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <Users size={14} /> Seats {table.capacity}
                </p>
                <p>{table.section}</p>
                {session ? (
                  <>
                    <p className="pt-2 font-medium text-gray-900">{session.party_name}</p>
                    <p className="flex items-center gap-2">
                      <Clock3 size={14} /> {formatElapsed(session.started_at)}
                    </p>
                    <p className="flex items-center gap-2">
                      <CreditCard size={14} /> ${session.running_total.toFixed(2)} · {session.rate_type === "per_person" ? "per person" : "per table"}
                    </p>
                    <p>{session.active_games} game(s) checked out</p>
                  </>
                ) : (
                  <p className="pt-2 text-sm text-gray-500">
                    {table.status === "reserved"
                      ? "Held for reservation"
                      : "Tap to start a new table session"}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
