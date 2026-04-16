"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Edit2, Grid2X2, List, Plus, Search, Trash2, X } from "lucide-react";
import { Badge, EmptyState, ErrorMessage, LoadingSpinner } from "@/components/ui";

interface Game {
  id: number;
  title: string;
  min_players: number;
  max_players: number;
  play_time_minutes: number;
  complexity: number;
  category: string;
  description: string;
  image_url: string;
  copies_total: number;
  copies_available: number;
  condition: string;
  condition_score: number;
  shelf_location: string;
  last_inspected_at: string;
  replacement_threshold: number;
  checkout_count: number;
  last_checked_out_at: string | null;
  needs_replacement: number;
}

const CATEGORIES = ["Strategy", "Family", "Party", "Cooperative", "Card Game", "Abstract", "Thematic", "Word Game"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Worn", "Needs Replacement"];

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [complexityFilter, setComplexityFilter] = useState("");
  const [playerCountFilter, setPlayerCountFilter] = useState("");
  const [replacementOnly, setReplacementOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (categoryFilter) params.set("category", categoryFilter);
        if (conditionFilter) params.set("condition", conditionFilter);
        if (complexityFilter) params.set("complexity", complexityFilter);
        if (playerCountFilter) params.set("playerCount", playerCountFilter);
        if (replacementOnly) params.set("needsReplacement", "true");

        const response = await fetch(`/api/games?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to load games");
        }
        const json = (await response.json()) as Game[];
        if (!cancelled) {
          setGames(json);
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
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, categoryFilter, conditionFilter, complexityFilter, playerCountFilter, replacementOnly, refreshKey]);

  const replacementCount = useMemo(
    () => games.filter((game) => Number(game.needs_replacement) === 1).length,
    [games],
  );

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this game from the library?")) {
      return;
    }

    try {
      const response = await fetch(`/api/games/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete game");
      }
      setRefreshKey((current) => current + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete game");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Game library</h1>
          <p className="text-sm text-gray-500">
            {games.length} titles loaded · {replacementCount} flagged for replacement review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === "grid" ? "bg-violet-600 text-white" : "text-gray-600"}`}
            >
              <Grid2X2 size={14} className="mr-1 inline" /> Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === "list" ? "bg-violet-600 text-white" : "text-gray-600"}`}
            >
              <List size={14} className="mr-1 inline" /> List
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            <Plus size={16} /> Add game
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-[1.6fr_repeat(5,minmax(0,1fr))]">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, category, or shelf"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none ring-violet-500 transition focus:ring-2"
            />
          </label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={conditionFilter}
            onChange={(event) => setConditionFilter(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
          >
            <option value="">All conditions</option>
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
          <select
            value={complexityFilter}
            onChange={(event) => setComplexityFilter(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
          >
            <option value="">All complexity</option>
            <option value="light">Light (under 2.0)</option>
            <option value="mid">Midweight (2.0-3.1)</option>
            <option value="heavy">Heavy (3.2+)</option>
          </select>
          <select
            value={playerCountFilter}
            onChange={(event) => setPlayerCountFilter(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
          >
            <option value="">Any player count</option>
            {[2, 3, 4, 5, 6, 8].map((count) => (
              <option key={count} value={count}>
                Seats {count}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={replacementOnly}
              onChange={(event) => setReplacementOnly(event.target.checked)}
            />
            <AlertTriangle size={14} className="text-amber-500" /> Needs replacement
          </label>
        </div>
      </div>

      {loading && <LoadingSpinner size="lg" />}
      {error && <ErrorMessage message={error} onRetry={() => setRefreshKey((current) => current + 1)} />}

      {!loading && !error && games.length === 0 && (
        <EmptyState
          icon="🎲"
          title="No games match these filters"
          description="Adjust the library filters or add a new title to your catalog."
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Add game
            </button>
          }
        />
      )}

      {!loading && !error && games.length > 0 && viewMode === "grid" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <article key={game.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {game.image_url ? (
                  <Image src={game.image_url} alt={game.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🎲</div>
                )}
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{game.title}</h2>
                    <p className="text-sm text-gray-500">{game.category}</p>
                  </div>
                  {Number(game.needs_replacement) === 1 && <Badge variant="warning">Review</Badge>}
                </div>
                <p className="line-clamp-2 text-sm text-gray-600">{game.description || "No notes yet for this title."}</p>
                <dl className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-400">Players</dt>
                    <dd>{game.min_players}-{game.max_players}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-400">Complexity</dt>
                    <dd>{game.complexity.toFixed(1)} / 5</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-400">Condition score</dt>
                    <dd>{game.condition_score}/5</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-400">Shelf</dt>
                    <dd>{game.shelf_location || "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-400">Copies</dt>
                    <dd>
                      {game.copies_available}/{game.copies_total} available
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-400">Checkouts</dt>
                    <dd>{game.checkout_count}</dd>
                  </div>
                </dl>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-400">Last inspected</p>
                    <p className="text-sm text-gray-600">
                      {new Date(game.last_inspected_at.replace(" ", "T")).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingGame(game)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-violet-200 hover:text-violet-600"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(game.id)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && games.length > 0 && viewMode === "list" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Game</th>
                  <th className="px-4 py-3 font-medium">Players</th>
                  <th className="px-4 py-3 font-medium">Complexity</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Inventory</th>
                  <th className="px-4 py-3 font-medium">Checkouts</th>
                  <th className="px-4 py-3 font-medium">Last inspected</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {games.map((game) => (
                  <tr key={game.id} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-gray-100">
                          {game.image_url ? (
                            <Image src={game.image_url} alt={game.title} fill className="object-cover" sizes="48px" />
                          ) : null}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{game.title}</p>
                            {Number(game.needs_replacement) === 1 && <AlertTriangle size={14} className="text-amber-500" />}
                          </div>
                          <p className="text-xs text-gray-500">{game.category} · Shelf {game.shelf_location || "TBD"}</p>
                          <p className="mt-1 max-w-sm text-xs text-gray-500">{game.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {game.min_players}-{game.max_players}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{game.complexity.toFixed(1)}</td>
                    <td className="px-4 py-4">
                      <Badge variant={game.condition_score <= 2 ? "warning" : "info"}>
                        {game.condition} ({game.condition_score}/5)
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {game.copies_available}/{game.copies_total}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {game.checkout_count} / threshold {game.replacement_threshold}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {new Date(game.last_inspected_at.replace(" ", "T")).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setEditingGame(game)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-violet-200 hover:text-violet-600"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(game.id)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:text-red-600"
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
            setRefreshKey((current) => current + 1);
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
    condition_score: game?.condition_score || 4,
    shelf_location: game?.shelf_location || "",
    replacement_threshold: game?.replacement_threshold || 12,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(game ? `/api/games/${game.id}` : "/api/games", {
        method: game ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to save game");
      }

      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save game");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{game ? "Edit game" : "Add game"}</h2>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Shelf location</label>
              <input
                value={form.shelf_location}
                onChange={(event) => setForm({ ...form, shelf_location: event.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <NumberField label="Min players" value={form.min_players} onChange={(value) => setForm({ ...form, min_players: value })} />
            <NumberField label="Max players" value={form.max_players} onChange={(value) => setForm({ ...form, max_players: value })} />
            <NumberField label="Play time" value={form.play_time_minutes} onChange={(value) => setForm({ ...form, play_time_minutes: value })} suffix="min" />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Complexity</label>
              <input
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={form.complexity}
                onChange={(event) => setForm({ ...form, complexity: Number(event.target.value) || 2.5 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <NumberField label="Copies" value={form.copies_total} onChange={(value) => setForm({ ...form, copies_total: value })} />
            <NumberField
              label="Condition score"
              value={form.condition_score}
              onChange={(value) => setForm({ ...form, condition_score: value })}
              min={1}
              max={5}
            />
            <NumberField
              label="Replacement threshold"
              value={form.replacement_threshold}
              onChange={(value) => setForm({ ...form, replacement_threshold: value })}
              min={1}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Condition label</label>
            <select
              value={form.condition}
              onChange={(event) => setForm({ ...form, condition: event.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            >
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Internal notes</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
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
              {saving ? "Saving..." : game ? "Save changes" : "Add game"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || min)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}
