"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorMessage, EmptyState, Badge } from "@/components/ui";
import { Search, Plus, X, AlertTriangle, Edit2, Trash2 } from "lucide-react";

interface Game {
  id: number;
  title: string;
  min_players: number;
  max_players: number;
  play_time_minutes: number;
  complexity: number;
  category: string;
  description: string;
  copies_total: number;
  copies_available: number;
  condition: string;
  needs_replacement: number;
  shelf_location: string;
}

const CATEGORIES = [
  "Strategy", "Family", "Party", "Cooperative", "Card Game",
  "Abstract", "Thematic", "Word Game",
];

const CONDITIONS = ["Excellent", "Good", "Fair", "Worn", "Needs Replacement"];

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [replacementFilter, setReplacementFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError(null);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (categoryFilter) params.set("category", categoryFilter);
        if (conditionFilter) params.set("condition", conditionFilter);
        if (replacementFilter) params.set("needsReplacement", "true");

        const res = await fetch(`/api/games?${params}`);
        if (!res.ok) throw new Error("Failed to load games");
        const json = await res.json();
        if (!cancelled) setGames(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, categoryFilter, conditionFilter, replacementFilter, refreshKey]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this game?")) return;
    try {
      await fetch(`/api/games/${id}`, { method: "DELETE" });
      setRefreshKey((k) => k + 1);
    } catch {
      alert("Failed to delete game");
    }
  };

  const conditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case "Excellent": return "success" as const;
      case "Good": return "info" as const;
      case "Fair": return "warning" as const;
      case "Worn": return "danger" as const;
      default: return "danger" as const;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Game Library</h1>
          <p className="text-gray-500 mt-1">{games.length} games in catalog</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={16} />
          Add Game
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={replacementFilter}
              onChange={(e) => setReplacementFilter(e.target.checked)}
              className="rounded"
            />
            <AlertTriangle size={14} className="text-amber-500" />
            Needs Replacement
          </label>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={() => setRefreshKey((k) => k + 1)} />}

      {!loading && !error && games.length === 0 && (
        <EmptyState
          icon="🎲"
          title="No games found"
          description="Add your first game or adjust filters."
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              Add Game
            </button>
          }
        />
      )}

      {!loading && !error && games.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Players</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Time</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Complexity</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Copies</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Condition</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Shelf</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {games.map((game) => (
                  <tr key={game.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{game.title}</span>
                        {game.needs_replacement === 1 && (
                          <AlertTriangle size={14} className="text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{game.category}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {game.min_players}–{game.max_players}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{game.play_time_minutes}m</td>
                    <td className="px-4 py-3 text-center text-gray-600">{game.complexity.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={game.copies_available === 0 ? "text-red-500 font-medium" : "text-gray-600"}>
                        {game.copies_available}/{game.copies_total}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={conditionBadgeVariant(game.condition)}>{game.condition}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{game.shelf_location}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingGame(game)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(game.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
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
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingGame) && (
        <GameModal
          game={editingGame}
          onClose={() => {
            setShowAddModal(false);
            setEditingGame(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setEditingGame(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function GameModal({
  game,
  onClose,
  onSaved,
}: {
  game: Game | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: game?.title || "",
    min_players: game?.min_players || 1,
    max_players: game?.max_players || 4,
    play_time_minutes: game?.play_time_minutes || 30,
    complexity: game?.complexity || 2.5,
    category: game?.category || "Strategy",
    description: game?.description || "",
    copies_total: game?.copies_total || 1,
    condition: game?.condition || "Good",
    shelf_location: game?.shelf_location || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = game ? `/api/games/${game.id}` : "/api/games";
      const method = game ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
    } catch {
      alert("Failed to save game");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{game ? "Edit Game" : "Add Game"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Players</label>
              <input
                type="number"
                min={1}
                value={form.min_players}
                onChange={(e) => setForm({ ...form, min_players: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Players</label>
              <input
                type="number"
                min={1}
                value={form.max_players}
                onChange={(e) => setForm({ ...form, max_players: parseInt(e.target.value) || 4 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Play Time (min)</label>
              <input
                type="number"
                min={1}
                value={form.play_time_minutes}
                onChange={(e) => setForm({ ...form, play_time_minutes: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complexity (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={form.complexity}
                onChange={(e) => setForm({ ...form, complexity: parseFloat(e.target.value) || 2.5 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Copies</label>
              <input
                type="number"
                min={1}
                value={form.copies_total}
                onChange={(e) => setForm({ ...form, copies_total: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Location</label>
              <input
                type="text"
                value={form.shelf_location}
                onChange={(e) => setForm({ ...form, shelf_location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : game ? "Update Game" : "Add Game"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
