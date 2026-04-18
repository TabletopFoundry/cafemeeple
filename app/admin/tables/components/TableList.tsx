"use client";

import { Badge } from "@/components/ui";
import type { Session, Table } from "@/lib/types";

interface TableListProps {
  tables: Table[];
  sessions: Session[];
  onSelectSession: (session: Session) => void;
}

export default function TableList({ tables, sessions, onSelectSession }: TableListProps) {
  const getSessionForTable = (tableId: number) =>
    sessions.find((session) => session.table_id === tableId);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Table</th>
              <th className="px-4 py-3 font-medium">Party</th>
              <th className="px-4 py-3 font-medium">Elapsed</th>
              <th className="px-4 py-3 font-medium">Billing</th>
              <th className="px-4 py-3 font-medium">Games</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tables.map((table) => {
              const session = getSessionForTable(table.id);
              return (
                <tr key={table.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{table.name}</p>
                      <p className="text-xs text-gray-500">
                        {table.section} · {table.capacity} seats
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {session ? (
                      `${session.party_name} (${session.party_size})`
                    ) : (
                      <Badge variant={table.status === "reserved" ? "warning" : "success"}>
                        {table.status}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {session ? formatElapsed(session.started_at) : "—"}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {session
                      ? `$${session.running_total.toFixed(2)} · ${session.rate_type === "per_person" ? "person" : "table"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{session ? session.active_games : "—"}</td>
                  <td className="px-4 py-4 text-right">
                    {session ? (
                      <button
                        onClick={() => onSelectSession(session)}
                        className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                      >
                        Billing summary
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Ready</span>
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

function formatElapsed(startedAt: string) {
  const start = new Date(startedAt.replace(" ", "T"));
  const diffMs = Date.now() - start.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
