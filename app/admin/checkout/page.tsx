"use client";

import { useState } from "react";
import { ErrorMessage, EmptyState, LoadingCard } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useMultiFetch } from "@/hooks/useFetch";
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

export default function CheckoutPage() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [gameSearch, setGameSearch] = useState("");
  const [tab, setTab] = useState<"active" | "history">("active");
  const [returnModal, setReturnModal] = useState<Checkout | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { addToast } = useToast();
  const { data, loading, error, refresh } = useMultiFetch<CheckoutPageData>({
    sessions: "/api/sessions?status=active",
    games: "/api/games",
    checkouts: "/api/checkout",
  });

  const sessions = data?.sessions ?? [];
  const games = data?.games ?? [];
  const checkouts = data?.checkouts ?? [];

  const handleCheckoutGame = async () => {
    if (!selectedSession || !selectedGame) return;
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
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to checkout game", "error");
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
      refresh();
    } catch {
      addToast("Failed to return game", "error");
    }
  };

  const activeCheckouts = checkouts.filter((checkout) => !checkout.returned_at);
  const pastCheckouts = checkouts.filter((checkout) => checkout.returned_at);
  const filteredGames = games.filter(
    (game) => game.copies_available > 0 && game.title.toLowerCase().includes(gameSearch.toLowerCase()),
  );

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

      {sessions.length > 0 && (
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
          onActiveIndexChange={setActiveIndex}
          onCheckout={handleCheckoutGame}
        />
      )}

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
            title="No games checked out"
            description="Check out a game to an active table session above."
          />
        ) : (
          <CheckoutTable checkouts={activeCheckouts} onReturn={setReturnModal} />
        ))}

      {tab === "history" &&
        (pastCheckouts.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No checkout history"
            description="Returned games will appear here."
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
