"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorMessage, Badge } from "@/components/ui";
import { Plus, X, Users, Clock, DollarSign, LogOut } from "lucide-react";

interface Table {
  id: number;
  name: string;
  capacity: number;
  section: string;
  status: string;
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
  ended_at: string | null;
  status: string;
  cover_charge_per_person: number;
  total_charge: number;
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError(null);
        const [tablesRes, sessionsRes] = await Promise.all([
          fetch("/api/tables"),
          fetch("/api/sessions?status=active"),
        ]);
        if (!tablesRes.ok || !sessionsRes.ok) throw new Error("Failed to load data");
        if (!cancelled) {
          setTables(await tablesRes.json());
          setSessions(await sessionsRes.json());
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleCheckout = async (sessionId: number) => {
    if (!confirm("Close this session and finalize billing?")) return;
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to close session");
    }
  };

  const getSessionForTable = (tableId: number) =>
    sessions.find((s) => s.table_id === tableId);

  const getElapsedTime = (startedAt: string) => {
    const start = new Date(startedAt.replace(" ", "T"));
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-emerald-100 border-emerald-300 text-emerald-800";
      case "occupied": return "bg-violet-100 border-violet-300 text-violet-800";
      case "reserved": return "bg-amber-100 border-amber-300 text-amber-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={() => setRefreshKey((k) => k + 1)} />;

  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const availableCount = tables.filter((t) => t.status === "available").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables & Sessions</h1>
          <p className="text-gray-500 mt-1">
            {availableCount} available · {occupiedCount} occupied · {tables.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView("map")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "map" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowCheckIn(true)}
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus size={16} />
            Check In
          </button>
        </div>
      </div>

      {/* Visual Table Map */}
      {view === "map" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {tables.map((table) => {
              const session = getSessionForTable(table.id);
              return (
                <div
                  key={table.id}
                  className={`p-4 rounded-xl border-2 transition-all ${statusColor(table.status)} ${
                    session ? "cursor-pointer hover:shadow-md" : ""
                  }`}
                  onClick={() => {
                    if (!session && table.status === "available") setShowCheckIn(true);
                  }}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">
                      {table.shape === "circle" ? "⭕" : table.shape === "square" ? "⬜" : "🟫"}
                    </div>
                    <p className="font-semibold text-sm truncate">{table.name}</p>
                    <p className="text-xs mt-0.5">
                      <Users size={10} className="inline mr-1" />{table.capacity} seats
                    </p>
                    {session && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <p className="text-xs font-medium truncate">{session.party_name}</p>
                        <p className="text-xs">
                          <Clock size={10} className="inline mr-1" />
                          {getElapsedTime(session.started_at)}
                        </p>
                        <p className="text-xs">
                          <DollarSign size={10} className="inline" />
                          {(session.party_size * session.cover_charge_per_person).toFixed(2)}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckout(session.id);
                          }}
                          className="mt-2 w-full flex items-center justify-center gap-1 bg-white/80 hover:bg-white text-xs py-1 rounded-md transition-colors"
                        >
                          <LogOut size={10} />
                          Check Out
                        </button>
                      </div>
                    )}
                    {!session && table.status === "available" && (
                      <p className="text-xs mt-2 opacity-70">Click to seat</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400" /> Available</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-200 border border-violet-400" /> Occupied</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" /> Reserved</span>
          </div>
        </div>
      )}

      {/* Active Sessions List */}
      {view === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-sm text-gray-700">All Tables</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {tables.map((table) => {
              const session = getSessionForTable(table.id);
              return (
                <div key={table.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      table.status === "occupied" ? "bg-violet-500" :
                      table.status === "available" ? "bg-emerald-500" : "bg-amber-500"
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{table.name}</p>
                      <p className="text-xs text-gray-500">{table.section} · {table.capacity} seats</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {session ? (
                      <>
                        <div className="text-right">
                          <p className="text-sm font-medium">{session.party_name}</p>
                          <p className="text-xs text-gray-500">
                            {session.party_size} guests · {getElapsedTime(session.started_at)}
                          </p>
                        </div>
                        <Badge variant="info">
                          ${(session.party_size * session.cover_charge_per_person).toFixed(2)}
                        </Badge>
                        <button
                          onClick={() => handleCheckout(session.id)}
                          className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                        >
                          Check Out
                        </button>
                      </>
                    ) : (
                      <Badge variant="success">Available</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckIn && (
        <CheckInModal
          tables={tables.filter((t) => t.status === "available")}
          onClose={() => setShowCheckIn(false)}
          onCheckedIn={() => {
            setShowCheckIn(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function CheckInModal({
  tables,
  onClose,
  onCheckedIn,
}: {
  tables: Table[];
  onClose: () => void;
  onCheckedIn: () => void;
}) {
  const [form, setForm] = useState({
    table_id: tables[0]?.id || 0,
    party_name: "",
    party_size: 2,
    cover_charge_per_person: 5.0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to check in");
      }
      onCheckedIn();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to check in");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Check In Party</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
            <select
              value={form.table_id}
              onChange={(e) => setForm({ ...form, table_id: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.capacity} seats) — {t.section}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
            <input
              type="text"
              value={form.party_name}
              onChange={(e) => setForm({ ...form, party_name: e.target.value })}
              placeholder="Walk-in"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
              <input
                type="number"
                min={1}
                value={form.party_size}
                onChange={(e) => setForm({ ...form, party_size: parseInt(e.target.value) || 2 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Charge/Person</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.cover_charge_per_person}
                onChange={(e) => setForm({ ...form, cover_charge_per_person: parseFloat(e.target.value) || 5.0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            Estimated total: <strong>${(form.party_size * form.cover_charge_per_person).toFixed(2)}</strong>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "Checking in..." : "Check In"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
