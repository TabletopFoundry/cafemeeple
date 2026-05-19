"use client";

import { useMemo, useState } from "react";
import { History, List, MapPinned, Plus, Settings2 } from "lucide-react";
import { ErrorMessage, LoadingCard } from "@/components/ui";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useMultiFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { Reservation, Session, Table } from "@/lib/types";
import CheckInModal from "./components/CheckInModal";
import CheckoutModal from "./components/CheckoutModal";
import FloorMap from "./components/FloorMap";
import SessionHistoryTable from "./components/SessionHistoryTable";
import TableEditorModal, { type TableFormValues } from "./components/TableEditorModal";
import TableList from "./components/TableList";
import TableManagement from "./components/TableManagement";

type ReservationRecord = Pick<
  Reservation,
  | "id"
  | "guest_name"
  | "party_size"
  | "table_id"
  | "reservation_date"
  | "reservation_time"
  | "duration_minutes"
  | "status"
>;

type TablesPageData = {
  tables: Table[];
  activeSessions: Session[];
  recentSessions: Session[];
  reservations: ReservationRecord[];
};

type ViewMode = "map" | "list" | "history" | "manage";

export default function TablesPage() {
  usePageTitle("Tables");
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInTableId, setCheckInTableId] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Table | null>(null);
  const { addToast } = useToast();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { data, loading, error, refresh } = useMultiFetch<TablesPageData>({
    tables: "/api/tables",
    activeSessions: "/api/sessions?status=active",
    recentSessions: "/api/sessions",
    reservations: `/api/reservations?date=${today}&limit=200`,
  });

  const tables = data?.tables ?? [];
  const activeSessions = data?.activeSessions ?? [];
  const recentSessions = data?.recentSessions ?? [];
  const reservations = (data?.reservations ?? []).filter(
    (reservation) =>
      reservation.status === "confirmed" || reservation.status === "pending",
  );
  const availableTables = tables.filter((table) => table.status === "available");
  const pageError = error === "Failed to load data" ? "Failed to load floor data" : error;

  const openCheckIn = (tableId?: number) => {
    if (availableTables.length === 0) {
      addToast("No tables are currently available to seat.", "warning");
      return;
    }

    const nextTableId =
      availableTables.find((table) => table.id === tableId)?.id ??
      availableTables[0]?.id ??
      null;
    setCheckInTableId(nextTableId);
    if (nextTableId) {
      setSelectedTableId(nextTableId);
    }
    setShowCheckIn(true);
  };

  const closeTableEditor = () => {
    setEditingTable(null);
    setShowTableEditor(false);
  };

  const handleOpenTableEditor = (table: Table | null) => {
    setEditingTable(table);
    setShowTableEditor(true);
    if (table) {
      setSelectedTableId(table.id);
    }
  };

  const handleCheckout = async (session: Session) => {
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Failed to close session");
      }

      setSelectedSession(null);
      refresh();
      addToast("Session closed successfully", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to close session", "error");
    }
  };

  const handleSaveTable = async (
    form: TableFormValues,
    tableId: number | null,
  ) => {
    const url = tableId ? `/api/tables/${tableId}` : "/api/tables";
    const method = tableId ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json().catch(() => null)) as
      | ({ error?: string } & Partial<Table>)
      | null;
    if (!response.ok) {
      throw new Error(payload?.error || "Failed to save table");
    }

    closeTableEditor();
    refresh();
    if (payload?.id) {
      setSelectedTableId(payload.id);
    }
    addToast(tableId ? "Table updated" : "Table added", "success");
  };

  const handleDeleteTable = async (table: Table) => {
    try {
      const response = await fetch(`/api/tables/${table.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete table");
      }

      setDeleteConfirm(null);
      if (selectedTableId === table.id) {
        setSelectedTableId(null);
      }
      refresh();
      addToast("Table removed", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to delete table", "error");
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-gray-200 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (pageError) {
    return <ErrorMessage message={pageError} onRetry={refresh} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables &amp; cover charges</h1>
          <p className="text-sm text-gray-500">
            {activeSessions.length} live parties · {availableTables.length} open tables · {recentSessions.length} recent sessions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {[
              { id: "map", label: "Floor map", icon: MapPinned },
              { id: "list", label: "Active list", icon: List },
              { id: "history", label: "History", icon: History },
              { id: "manage", label: "Manage", icon: Settings2 },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setViewMode(option.id as ViewMode)}
                  aria-pressed={viewMode === option.id}
                  className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                    viewMode === option.id
                      ? "bg-violet-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  <Icon size={14} /> {option.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => openCheckIn()}
            disabled={availableTables.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} /> Check in party
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("manage");
              handleOpenTableEditor(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Plus size={16} /> Add table
          </button>
        </div>
      </div>

      {viewMode === "map" && (
        <FloorMap
          tables={tables}
          sessions={activeSessions}
          reservations={reservations}
          selectedTableId={selectedTableId}
          onSelectTable={setSelectedTableId}
          onSelectSession={setSelectedSession}
          onStartCheckIn={openCheckIn}
          onEditTable={handleOpenTableEditor}
        />
      )}

      {viewMode === "list" && (
        <TableList
          tables={tables}
          sessions={activeSessions}
          reservations={reservations}
          onSelectSession={setSelectedSession}
          onStartCheckIn={openCheckIn}
          onEditTable={handleOpenTableEditor}
        />
      )}

      {viewMode === "history" && <SessionHistoryTable sessions={recentSessions} />}

      {viewMode === "manage" && (
        <TableManagement
          tables={tables}
          onAdd={() => handleOpenTableEditor(null)}
          onEdit={handleOpenTableEditor}
          onDelete={setDeleteConfirm}
        />
      )}

      {showCheckIn && (
        <CheckInModal
          tables={availableTables}
          initialTableId={checkInTableId}
          onClose={() => setShowCheckIn(false)}
          onSaved={() => {
            setShowCheckIn(false);
            refresh();
            addToast("Table session started", "success");
          }}
        />
      )}

      {selectedSession && (
        <CheckoutModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onConfirm={() => handleCheckout(selectedSession)}
        />
      )}

      {showTableEditor && (
        <TableEditorModal
          table={editingTable}
          onClose={closeTableEditor}
          onSubmit={handleSaveTable}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete table"
          message={`Delete ${deleteConfirm.name}? Existing API guardrails will block this if the table has sessions, reservations, or history.`}
          confirmLabel="Delete table"
          onConfirm={() => handleDeleteTable(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
