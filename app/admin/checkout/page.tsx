"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ErrorMessage, EmptyState, LoadingCard } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useMultiFetch } from "@/hooks/useFetch";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { Checkout, GameSummary, Session } from "@/lib/types";
import CheckoutForm from "./components/CheckoutForm";
import CheckoutHistory from "./components/CheckoutHistory";
import CheckoutTable from "./components/CheckoutTable";
import ReturnModal from "./components/ReturnModal";

type CheckoutSession = Pick<
  Session,
  "id" | "table_name" | "party_name" | "party_size" | "started_at" | "status"
>;

type CheckoutPageData = {
  sessions: CheckoutSession[];
  games: GameSummary[];
  checkouts: Checkout[];
};

const EMPTY_SESSIONS: CheckoutSession[] = [];
const EMPTY_GAMES: GameSummary[] = [];
const EMPTY_CHECKOUTS: Checkout[] = [];

export default function CheckoutPage() {
  usePageTitle("Checkout");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [gameSearch, setGameSearch] = useState("");
  const [tab, setTab] = useState<"active" | "history">("active");
  const [returnModal, setReturnModal] = useState<Checkout | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [recordSessionFilter, setRecordSessionFilter] = useState<number | null>(null);
  const [recordGameFilter, setRecordGameFilter] = useState<number | null>(null);
  const { addToast } = useToast();
  const { data, loading, error, refresh } = useMultiFetch<CheckoutPageData>({
    sessions: "/api/sessions?status=active",
    games: "/api/games",
    checkouts: "/api/checkout",
  });

  const sessions = data?.sessions ?? EMPTY_SESSIONS;
  const games = data?.games ?? EMPTY_GAMES;
  const checkouts = data?.checkouts ?? EMPTY_CHECKOUTS;

  const handleCheckoutGame = async () => {
    if (!selectedSession || !selectedGame || isSubmittingCheckout) return;
    setIsSubmittingCheckout(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: selectedSession, game_id: selectedGame }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to checkout");
      }

      setSelectedGame(null);
      setGameSearch("");
      setActiveIndex(-1);
      refresh();
      addToast("Game checked out", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to checkout game", "error");
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  const handleReturn = async (checkoutId: number, condition: string, notes: string) => {
    try {
      const res = await fetch(`/api/checkout/${checkoutId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_condition: condition, notes }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to return");
      }
      setReturnModal(null);
      refresh();
      addToast("Game returned", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to return game", "error");
    }
  };

  const filteredGames = games.filter(
    (game) => game.copies_available > 0 && game.title.toLowerCase().includes(gameSearch.toLowerCase()),
  );

  const filteredCheckouts = useMemo(() => {
    return checkouts.filter((checkout) => {
      if (recordSessionFilter && checkout.session_id !== recordSessionFilter) return false;
      if (recordGameFilter && checkout.game_id !== recordGameFilter) return false;
      return true;
    });
  }, [checkouts, recordSessionFilter, recordGameFilter]);

  const activeCheckouts = filteredCheckouts.filter((checkout) => !checkout.returned_at);
  const pastCheckouts = filteredCheckouts.filter((checkout) => checkout.returned_at);
  const hasFilters = recordSessionFilter !== null || recordGameFilter !== null;

  const recordSessionOptions = Array.from(
    new Map(
      checkouts.map((checkout) => [
        checkout.session_id,
        {
          id: checkout.session_id,
          label: `${checkout.table_name ?? "Unknown table"} — ${checkout.party_name ?? "Unknown party"}`,
        },
      ]),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label));

  const handleGameSearchChange = (value: string) => {
    setGameSearch(value);
    setSelectedGame(null);
    setActiveIndex(-1);
  };

  const handleGameSelect = (gameId: number, title: string) => {
    setSelectedGame(gameId);
    setGameSearch(title);
    setActiveIndex(-1);
  };

  const clearSelectedGame = () => {
    setSelectedGame(null);
    setGameSearch("");
    setActiveIndex(-1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Game Checkout</h1>
        <p className="text-gray-500 mt-1">Assign games to tables and track returns</p>
      </div>

      {sessions.length > 0 ? (
        <CheckoutForm
          sessions={sessions}
          filteredGames={filteredGames}
          selectedSession={selectedSession}
          selectedGame={selectedGame}
          gameSearch={gameSearch}
          activeIndex={activeIndex}
          onSessionChange={setSelectedSession}
          onGameSearchChange={handleGameSearchChange}
          onGameSelect={handleGameSelect}
          onGameClear={clearSelectedGame}
          onActiveIndexChange={setActiveIndex}
          onCheckout={handleCheckoutGame}
          isSubmitting={isSubmittingCheckout}
        />
      ) : (
        <div className="mb-6">
          <EmptyState
            icon="🪑"
            title="No active table sessions"
            description="Start a table session before checking out games to guests."
            action={
              <Link
                href="/admin/tables"
                className="inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                Open tables
              </Link>
            }
          />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Ledger filters</h2>
            <p className="text-xs text-gray-500">
              Filter the checkout ledger by table session or game to find active and returned records faster.
            </p>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setRecordSessionFilter(null);
                setRecordGameFilter(null);
              }}
              className="w-fit rounded-lg px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
            >
              Reset filters
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Session</span>
            <select
              value={recordSessionFilter ?? ""}
              onChange={(event) =>
                setRecordSessionFilter(event.target.value ? Number(event.target.value) : null)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            >
              <option value="">All sessions</option>
              {recordSessionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Game</span>
            <select
              value={recordGameFilter ?? ""}
              onChange={(event) =>
                setRecordGameFilter(event.target.value ? Number(event.target.value) : null)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            >
              <option value="">All games</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {filteredCheckouts.length} matching records
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-6 w-fit">
        <button
          onClick={() => setTab("active")}
          aria-pressed={tab === "active"}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "active" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
          }`}
        >
          Active ({activeCheckouts.length})
        </button>
        <button
          onClick={() => setTab("history")}
          aria-pressed={tab === "history"}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "history" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
          }`}
        >
          History ({pastCheckouts.length})
        </button>
      </div>

      {tab === "active" &&
        (activeCheckouts.length === 0 ? (
          <EmptyState
            icon="🎲"
            title={hasFilters ? "No active checkouts match these filters" : "No games checked out"}
            description={
              hasFilters
                ? "Reset the ledger filters or switch to history to find older checkouts."
                : "Check out a game to an active table session above."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setRecordSessionFilter(null);
                    setRecordGameFilter(null);
                  }}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Reset filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <CheckoutTable checkouts={activeCheckouts} onReturn={setReturnModal} />
        ))}

      {tab === "history" &&
        (pastCheckouts.length === 0 ? (
          <EmptyState
            icon="📋"
            title={hasFilters ? "No returned games match these filters" : "No checkout history"}
            description={
              hasFilters
                ? "Try a different game or session filter to find the right return record."
                : "Returned games will appear here."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setRecordSessionFilter(null);
                    setRecordGameFilter(null);
                  }}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Reset filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <CheckoutHistory checkouts={pastCheckouts.slice(0, 50)} />
        ))}

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
