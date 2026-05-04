"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ErrorMessage, LoadingCard } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useMultiFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { Session, Table } from "@/lib/types";
import CheckInModal from "./components/CheckInModal";
import CheckoutModal from "./components/CheckoutModal";
import FloorMap from "./components/FloorMap";
import TableList from "./components/TableList";

export default function TablesPage() {
  usePageTitle("Tables");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const { addToast } = useToast();

  const { data, loading, error, refresh } = useMultiFetch<{
    tables: Table[];
    sessions: Session[];
  }>({ tables: "/api/tables", sessions: "/api/sessions?status=active" });

  const tables = data?.tables ?? [];
  const sessions = data?.sessions ?? [];
  const availableTables = tables.filter((table) => table.status === "available");
  const pageError = error === "Failed to load data" ? "Failed to load floor data" : error;

  const handleCheckout = async (session: Session) => {
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "Failed to close session");
      }

      setSelectedSession(null);
      refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to close session", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-gray-200 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <LoadingCard key={i} />
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
          <h1 className="text-2xl font-bold text-gray-900">Tables & cover charges</h1>
          <p className="text-sm text-gray-500">
            {sessions.length} live parties · {availableTables.length} open tables ready to seat.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewMode("map")}
              aria-pressed={viewMode === "map"}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === "map" ? "bg-violet-600 text-white" : "text-gray-600"}`}
            >
              Floor map
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === "list" ? "bg-violet-600 text-white" : "text-gray-600"}`}
            >
              Active list
            </button>
          </div>
          <button
            onClick={() => setShowCheckIn(true)}
            disabled={availableTables.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} /> Check in party
          </button>
        </div>
      </div>

      {viewMode === "map" && (
        <FloorMap
          tables={tables}
          sessions={sessions}
          onSelectSession={setSelectedSession}
          onStartCheckIn={() => setShowCheckIn(true)}
        />
      )}

      {viewMode === "list" && (
        <TableList
          tables={tables}
          sessions={sessions}
          onSelectSession={setSelectedSession}
        />
      )}

      {showCheckIn && (
        <CheckInModal
          tables={availableTables}
          onClose={() => setShowCheckIn(false)}
          onSaved={() => {
            setShowCheckIn(false);
            refresh();
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
    </div>
  );
}
