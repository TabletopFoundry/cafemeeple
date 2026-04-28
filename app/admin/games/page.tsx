"use client";

import { useMemo, useState } from "react";
import { Grid2X2, List, Plus } from "lucide-react";
import { EmptyState, ErrorMessage, LoadingSpinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useFetch } from "@/hooks/useFetch";
import type { Game } from "@/lib/types";
import GameFilterBar from "./components/GameFilterBar";
import GameGrid from "./components/GameGrid";
import GameListTable from "./components/GameListTable";
import GameModal from "./components/GameModal";
import { GAME_CATEGORIES } from "@/lib/constants";

export default function GamesPage() {
  usePageTitle("Games");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [complexityFilter, setComplexityFilter] = useState("");
  const [playerCountFilter, setPlayerCountFilter] = useState("");
  const [replacementOnly, setReplacementOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { addToast } = useToast();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (conditionFilter) params.set("condition", conditionFilter);
    if (complexityFilter) params.set("complexity", complexityFilter);
    if (playerCountFilter) params.set("playerCount", playerCountFilter);
    if (replacementOnly) params.set("needsReplacement", "true");
    return params.toString();
  }, [search, categoryFilter, conditionFilter, complexityFilter, playerCountFilter, replacementOnly]);

  const { data: games, loading, error, refresh } = useFetch<Game[]>(
    `/api/games?${queryString}`,
    [queryString],
    { debounceMs: 250 },
  );

  const gamesList = games ?? [];
  const replacementCount = useMemo(() => gamesList.filter((game) => Number(game.needs_replacement) === 1).length, [gamesList]);
  const closeModal = () => {
    setShowAddModal(false);
    setEditingGame(null);
  };
  const handleSaved = () => {
    closeModal();
    refresh();
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/games/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete game");
      }
      setDeleteConfirm(null);
      refresh();
      addToast("Game removed from library", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete game", "error");
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Game library</h1>
          <p className="text-sm text-gray-500">{gamesList.length} titles loaded · {replacementCount} flagged for replacement review.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button onClick={() => setViewMode("grid")} aria-pressed={viewMode === "grid"} className={`rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === "grid" ? "bg-violet-600 text-white" : "text-gray-600"}`}>
              <Grid2X2 size={14} className="mr-1 inline" /> Grid
            </button>
            <button onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"} className={`rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === "list" ? "bg-violet-600 text-white" : "text-gray-600"}`}>
              <List size={14} className="mr-1 inline" /> List
            </button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700">
            <Plus size={16} /> Add game
          </button>
        </div>
      </div>

      <GameFilterBar
        search={search}
        onSearchChange={setSearch}
        categories={GAME_CATEGORIES}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        conditionFilter={conditionFilter}
        onConditionFilterChange={setConditionFilter}
        complexityFilter={complexityFilter}
        onComplexityFilterChange={setComplexityFilter}
        playerCountFilter={playerCountFilter}
        onPlayerCountFilterChange={setPlayerCountFilter}
        replacementOnly={replacementOnly}
        onReplacementOnlyChange={setReplacementOnly}
      />

      {loading && <LoadingSpinner size="lg" />}
      {error && <ErrorMessage message={error} onRetry={refresh} />}

      {!loading && !error && gamesList.length === 0 && (
        <EmptyState
          icon="🎲"
          title="No games match these filters"
          description="Adjust the library filters or add a new title to your catalog."
          action={<button onClick={() => setShowAddModal(true)} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">Add game</button>}
        />
      )}

      {!loading && !error && gamesList.length > 0 && (
        viewMode === "grid" ? (
          <GameGrid games={gamesList} onEdit={setEditingGame} onDelete={setDeleteConfirm} />
        ) : (
          <GameListTable games={gamesList} onEdit={setEditingGame} onDelete={setDeleteConfirm} />
        )
      )}

      {(showAddModal || editingGame) && <GameModal game={editingGame} categories={GAME_CATEGORIES} onClose={closeModal} onSaved={handleSaved} />}

      {deleteConfirm !== null && (
        <ConfirmDialog
          title="Remove game"
          message="Remove this game from the library? This action cannot be undone."
          confirmLabel="Remove"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
