"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, CreditCard, LogOut, Plus, Users, X } from "lucide-react";
import { Badge, ErrorMessage, LoadingSpinner } from "@/components/ui";

interface Table {
  id: number;
  name: string;
  capacity: number;
  section: string;
  status: "available" | "occupied" | "reserved";
  x_position: number;
  y_position: number;
  shape: string;
}

interface Session {
  id: number;
  table_id: number;
  table_name: string;
  party_name: string;
  party_size: number;
  started_at: string;
  status: string;
  rate_type: "per_person" | "per_table";
  cover_charge_per_person: number;
  running_total: number;
  active_games: number;
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [tablesResponse, sessionsResponse] = await Promise.all([
          fetch("/api/tables"),
          fetch("/api/sessions?status=active"),
        ]);

        if (!tablesResponse.ok || !sessionsResponse.ok) {
          throw new Error("Failed to load floor data");
        }

        if (!cancelled) {
          setTables((await tablesResponse.json()) as Table[]);
          setSessions((await sessionsResponse.json()) as Session[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const availableTables = useMemo(
    () => tables.filter((table) => table.status === "available"),
    [tables],
  );

  const handleCheckout = async (session: Session) => {
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });

      if (!response.ok) {
        throw new Error("Failed to close session");
      }

      setSelectedSession(null);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to close session");
    }
  };

  const getSessionForTable = (tableId: number) => sessions.find((session) => session.table_id === tableId);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => setRefreshKey((current) => current + 1)} />;
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
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === "map" ? "bg-violet-600 text-white" : "text-gray-600"}`}
            >
              Floor map
            </button>
            <button
              onClick={() => setViewMode("list")}
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {tables.map((table) => {
              const session = getSessionForTable(table.id);
              return (
                <button
                  key={table.id}
                  onClick={() => {
                    if (session) {
                      setSelectedSession(session);
                    } else if (table.status === "available") {
                      setShowCheckIn(true);
                    }
                  }}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    table.status === "occupied"
                      ? "border-violet-200 bg-violet-50"
                      : table.status === "reserved"
                        ? "border-amber-200 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{table.name}</p>
                    <Badge variant={table.status === "occupied" ? "info" : table.status === "reserved" ? "warning" : "success"}>
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
                        {table.status === "reserved" ? "Held for reservation" : "Tap to start a new table session"}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "list" && (
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
                          <p className="text-xs text-gray-500">{table.section} · {table.capacity} seats</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {session ? `${session.party_name} (${session.party_size})` : <Badge variant={table.status === "reserved" ? "warning" : "success"}>{table.status}</Badge>}
                      </td>
                      <td className="px-4 py-4 text-gray-600">{session ? formatElapsed(session.started_at) : "—"}</td>
                      <td className="px-4 py-4 text-gray-600">
                        {session ? `$${session.running_total.toFixed(2)} · ${session.rate_type === "per_person" ? "person" : "table"}` : "—"}
                      </td>
                      <td className="px-4 py-4 text-gray-600">{session ? session.active_games : "—"}</td>
                      <td className="px-4 py-4 text-right">
                        {session ? (
                          <button
                            onClick={() => setSelectedSession(session)}
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
      )}

      {showCheckIn && (
        <CheckInModal
          tables={availableTables}
          onClose={() => setShowCheckIn(false)}
          onSaved={() => {
            setShowCheckIn(false);
            setRefreshKey((current) => current + 1);
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

function formatElapsed(startedAt: string) {
  const start = new Date(startedAt.replace(" ", "T"));
  const diffMs = Date.now() - start.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function CheckInModal({
  tables,
  onClose,
  onSaved,
}: {
  tables: Table[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    table_id: tables[0]?.id ?? 0,
    party_name: "",
    party_size: 2,
    rate_type: "per_person",
    cover_charge_per_person: 5,
  });
  const [saving, setSaving] = useState(false);

  const selectedTable = tables.find((table) => table.id === form.table_id);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to check in party");
      }

      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to check in party");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Seat a new party</h2>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Table</label>
            <select
              value={form.table_id}
              onChange={(event) => setForm({ ...form, table_id: Number(event.target.value) })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            >
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name} · {table.capacity} seats · {table.section}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Party name</label>
              <input
                value={form.party_name}
                onChange={(event) => setForm({ ...form, party_name: event.target.value })}
                placeholder="Walk-in"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Guest count</label>
              <input
                type="number"
                min={1}
                max={selectedTable?.capacity ?? 12}
                value={form.party_size}
                onChange={(event) => setForm({ ...form, party_size: Number(event.target.value) || 1 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Rate model</label>
              <select
                value={form.rate_type}
                onChange={(event) => setForm({ ...form, rate_type: event.target.value, cover_charge_per_person: event.target.value === "per_table" ? 24 : 5 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
              >
                <option value="per_person">Per person</option>
                <option value="per_table">Per table</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {form.rate_type === "per_person" ? "Rate per guest" : "Rate per table"}
              </label>
              <input
                type="number"
                min={1}
                step={0.5}
                value={form.cover_charge_per_person}
                onChange={(event) => setForm({ ...form, cover_charge_per_person: Number(event.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
              />
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-900">Estimated cover charge</p>
            <p className="mt-1 text-lg font-semibold text-violet-700">
              ${
                (form.rate_type === "per_person"
                  ? form.party_size * form.cover_charge_per_person
                  : form.cover_charge_per_person
                ).toFixed(2)
              }
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {selectedTable ? `${selectedTable.name} seats up to ${selectedTable.capacity} guests.` : "Select a table."}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? "Starting session..." : "Start timer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckoutModal({
  session,
  onClose,
  onConfirm,
}: {
  session: Session;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Billing summary</h2>
            <p className="text-sm text-gray-500">{session.table_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 p-6 text-sm text-gray-600">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-medium text-gray-900">{session.party_name || "Walk-in"}</p>
            <p className="mt-1">{session.party_size} guests · {formatElapsed(session.started_at)} elapsed</p>
          </div>
          <div className="space-y-2">
            <SummaryRow label="Rate type" value={session.rate_type === "per_person" ? "Per person" : "Per table"} />
            <SummaryRow label="Rate amount" value={`$${session.cover_charge_per_person.toFixed(2)}`} />
            <SummaryRow label="Games checked out" value={String(session.active_games)} />
            <SummaryRow label="Total due" value={`$${session.running_total.toFixed(2)}`} emphasis />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Keep open
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              <LogOut size={14} /> Close session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={emphasis ? "font-semibold text-gray-900" : "text-gray-700"}>{value}</span>
    </div>
  );
}
