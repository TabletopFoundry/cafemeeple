"use client";

import { useMemo, useState } from "react";
import { Badge, EmptyState } from "@/components/ui";
import { formatDateTime, formatElapsed } from "@/lib/date-utils";
import type { Session } from "@/lib/types";

interface SessionHistoryTableProps {
  sessions: Session[];
}

function statusVariant(status: Session["status"]) {
  return status === "active" ? "info" as const : "success" as const;
}

function durationLabel(session: Session) {
  if (!session.ended_at) {
    return formatElapsed(session.started_at);
  }

  const started = new Date(session.started_at.replace(" ", "T")).getTime();
  const ended = new Date(session.ended_at.replace(" ", "T")).getTime();
  const diffMs = Math.max(ended - started, 0);
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function SessionHistoryTable({ sessions }: SessionHistoryTableProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | Session["status"]>("all");

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) =>
      statusFilter === "all" ? true : session.status === statusFilter,
    );
  }, [sessions, statusFilter]);

  const activeCount = sessions.filter((session) => session.status === "active").length;
  const completedCount = sessions.filter((session) => session.status === "completed").length;

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon="🕒"
        title="No session history yet"
        description="Completed and active table sessions will appear here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent session history</h2>
          <p className="text-sm text-gray-500">
            Review completed billing sessions and any tables still running.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {[
            { id: "all", label: `All (${sessions.length})` },
            { id: "active", label: `Active (${activeCount})` },
            { id: "completed", label: `Completed (${completedCount})` },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                setStatusFilter(option.id as "all" | Session["status"])
              }
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === option.id
                  ? "bg-violet-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Table</th>
              <th className="px-4 py-3 font-medium">Party</th>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Billing</th>
              <th className="px-4 py-3 text-right font-medium">Charge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <Badge variant={statusVariant(session.status)}>{session.status}</Badge>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{session.table_name}</p>
                    <p className="text-xs text-gray-500">{session.table_capacity} seats</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-600">
                  <p className="font-medium text-gray-900">{session.party_name}</p>
                  <p className="text-xs text-gray-500">{session.party_size} guests</p>
                </td>
                <td className="px-4 py-4 text-gray-600">{formatDateTime(session.started_at)}</td>
                <td className="px-4 py-4 text-gray-600">
                  <p>{durationLabel(session)}</p>
                  <p className="text-xs text-gray-500">
                    {session.ended_at ? formatDateTime(session.ended_at) : "Still running"}
                  </p>
                </td>
                <td className="px-4 py-4 text-gray-600">
                  {session.rate_type === "per_person"
                    ? `$${session.cover_charge_per_person.toFixed(2)} / guest`
                    : `$${session.cover_charge_per_person.toFixed(2)} / table`}
                </td>
                <td className="px-4 py-4 text-right font-medium text-gray-900">
                  {session.status === "completed"
                    ? `$${session.total_charge.toFixed(2)}`
                    : `$${session.running_total.toFixed(2)} est.`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
