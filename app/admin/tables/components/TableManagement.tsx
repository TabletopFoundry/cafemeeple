"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import type { Table } from "@/lib/types";

interface TableManagementProps {
  tables: Table[];
  onAdd: () => void;
  onEdit: (table: Table) => void;
  onDelete: (table: Table) => void;
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

export default function TableManagement({
  tables,
  onAdd,
  onEdit,
  onDelete,
}: TableManagementProps) {
  const available = tables.filter((table) => table.status === "available").length;
  const blocked = tables.filter((table) => table.status === "maintenance").length;

  if (tables.length === 0) {
    return (
      <EmptyState
        icon="🪑"
        title="No tables yet"
        description="Add your first table to start managing the floor plan."
        action={
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Plus size={16} /> Add table
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Tables" value={String(tables.length)} />
        <Stat title="Ready to seat" value={String(available)} tone="emerald" />
        <Stat title="Under maintenance" value={String(blocked)} tone="gray" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Manage table roster</h2>
            <p className="text-sm text-gray-500">
              Edit layout coordinates, sections, and maintenance state.
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            <Plus size={16} /> Add table
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Table</th>
                <th className="px-4 py-3 font-medium">Section</th>
                <th className="px-4 py-3 font-medium">Layout</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tables.map((table) => (
                <tr key={table.id} className="align-top hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{table.name}</p>
                      <p className="text-xs text-gray-500">{table.capacity} seats</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{table.section}</td>
                  <td className="px-4 py-4 text-gray-600">
                    <p className="capitalize">{table.shape}</p>
                    <p className="text-xs text-gray-500">
                      x {table.x_position} · y {table.y_position}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusVariant(table.status)}>{table.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(table)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-violet-200 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        aria-label={`Edit ${table.name}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(table)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        aria-label={`Delete ${table.name}`}
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
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          Delete is only allowed for unused tables with no active sessions, reservations,
          or historical usage. Existing guardrails remain enforced by
          `app/api/tables/[id]/route.ts`.
        </div>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  tone = "violet",
}: {
  title: string;
  value: string;
  tone?: "violet" | "emerald" | "gray";
}) {
  const toneClasses = {
    violet: "bg-violet-50 text-violet-700",
    emerald: "bg-emerald-50 text-emerald-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <div className={`mt-3 inline-flex rounded-lg px-3 py-1 text-2xl font-semibold ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  );
}
