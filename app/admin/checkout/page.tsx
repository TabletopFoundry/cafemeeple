"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorMessage, EmptyState, Badge } from "@/components/ui";
import { ArrowLeftRight, Undo2, Search } from "lucide-react";

interface Session {
  id: number;
  table_name: string;
  party_name: string;
  party_size: number;
  started_at: string;
  status: string;
}

interface Game {
  id: number;
  title: string;
  category: string;
  copies_available: number;
}

interface Checkout {
  id: number;
  session_id: number;
  game_id: number;
  game_title: string;
  game_category: string;
  table_name: string;
  party_name: string;
  checked_out_at: string;
  returned_at: string | null;
  return_condition: string | null;
  notes: string;
}

const CONDITIONS = ["Excellent", "Good", "Fair", "Worn", "Needs Replacement"];

export default function CheckoutPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [gameSearch, setGameSearch] = useState("");
  const [tab, setTab] = useState<"active" | "history">("active");
  const [returnModal, setReturnModal] = useState<Checkout | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError(null);
        const [sessionsRes, gamesRes, checkoutsRes] = await Promise.all([
          fetch("/api/sessions?status=active"),
          fetch("/api/games"),
          fetch("/api/checkout"),
        ]);
        if (!sessionsRes.ok || !gamesRes.ok || !checkoutsRes.ok) throw new Error("Failed to load data");
        if (!cancelled) {
          setSessions(await sessionsRes.json());
          setGames(await gamesRes.json());
          setCheckouts(await checkoutsRes.json());
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

  const handleCheckoutGame = async () => {
    if (!selectedSession || !selectedGame) return;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSession, game_id: selectedGame }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to checkout");
      }
      setSelectedGame(null);
      setGameSearch("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to checkout game");
    }
  };

  const handleReturn = async (checkoutId: number, condition: string, notes: string) => {
    try {
      const res = await fetch(`/api/checkout/${checkoutId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_condition: condition, notes }),
      });
      if (!res.ok) throw new Error("Failed to return");
      setReturnModal(null);
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to return game");
    }
  };

  const activeCheckouts = checkouts.filter((c) => !c.returned_at);
  const pastCheckouts = checkouts.filter((c) => c.returned_at);
  const filteredGames = games.filter(
    (g) => g.copies_available > 0 && g.title.toLowerCase().includes(gameSearch.toLowerCase())
  );

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={() => setRefreshKey((k) => k + 1)} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Game Checkout</h1>
        <p className="text-gray-500 mt-1">Assign games to tables and track returns</p>
      </div>

      {/* Checkout Form */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <ArrowLeftRight size={18} className="inline mr-2" />
            Check Out a Game
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active Session</label>
              <select
                value={selectedSession || ""}
                onChange={(e) => setSelectedSession(parseInt(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select a table...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.table_name} — {s.party_name} ({s.party_size} guests)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Game</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={gameSearch}
                  onChange={(e) => {
                    setGameSearch(e.target.value);
                    setSelectedGame(null);
                  }}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              {gameSearch && !selectedGame && (
                <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto absolute z-10">
                  {filteredGames.slice(0, 10).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setSelectedGame(g.id);
                        setGameSearch(g.title);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-violet-50 flex justify-between"
                    >
                      <span>{g.title}</span>
                      <span className="text-gray-400">{g.copies_available} avail</span>
                    </button>
                  ))}
                  {filteredGames.length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-400">No available games found</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCheckoutGame}
                disabled={!selectedSession || !selectedGame}
                className="w-full bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Check Out Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-6 w-fit">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "active" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
          }`}
        >
          Active ({activeCheckouts.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "history" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
          }`}
        >
          History ({pastCheckouts.length})
        </button>
      </div>

      {tab === "active" && (
        activeCheckouts.length === 0 ? (
          <EmptyState
            icon="🎲"
            title="No games checked out"
            description="Check out a game to an active table session above."
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Game</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Table</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Party</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Checked Out</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeCheckouts.map((co) => (
                  <tr key={co.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{co.game_title}</p>
                      <p className="text-xs text-gray-500">{co.game_category}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{co.table_name}</td>
                    <td className="px-4 py-3 text-gray-600">{co.party_name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(co.checked_out_at.replace(" ", "T")).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setReturnModal(co)}
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 text-sm font-medium"
                      >
                        <Undo2 size={14} />
                        Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "history" && (
        pastCheckouts.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No checkout history"
            description="Returned games will appear here."
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Game</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Table</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Checked Out</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Returned</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pastCheckouts.slice(0, 50).map((co) => (
                  <tr key={co.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{co.game_title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{co.table_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {new Date(co.checked_out_at.replace(" ", "T")).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {co.returned_at ? new Date(co.returned_at.replace(" ", "T")).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          co.return_condition === "Good" || co.return_condition === "Excellent"
                            ? "success"
                            : co.return_condition === "Fair"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {co.return_condition || "-"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Return Modal */}
      {returnModal && (
        <ReturnModal
          checkout={returnModal}
          onClose={() => setReturnModal(null)}
          onReturn={handleReturn}
        />
      )}
    </div>
  );
}

function ReturnModal({
  checkout,
  onClose,
  onReturn,
}: {
  checkout: Checkout;
  onClose: () => void;
  onReturn: (id: number, condition: string, notes: string) => void;
}) {
  const [condition, setCondition] = useState("Good");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-4">Return: {checkout.game_title}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (missing pieces, damage, etc.)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Optional notes about game condition..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onReturn(checkout.id, condition, notes)}
              className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              Return Game
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
