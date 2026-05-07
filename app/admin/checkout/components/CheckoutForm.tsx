"use client";

import { useId } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import type { GameSummary, Session } from "@/lib/types";

type CheckoutSession = Pick<
  Session,
  "id" | "table_name" | "party_name" | "party_size" | "started_at" | "status"
>;

interface CheckoutFormProps {
  sessions: CheckoutSession[];
  filteredGames: GameSummary[];
  selectedSession: number | null;
  selectedGame: number | null;
  gameSearch: string;
  activeIndex: number;
  isSubmitting: boolean;
  onSessionChange: (sessionId: number | null) => void;
  onGameSearchChange: (value: string) => void;
  onGameSelect: (gameId: number, title: string) => void;
  onActiveIndexChange: (value: number | ((prev: number) => number)) => void;
  onCheckout: () => void;
}

export default function CheckoutForm({
  sessions,
  filteredGames,
  selectedSession,
  selectedGame,
  gameSearch,
  activeIndex,
  isSubmitting,
  onSessionChange,
  onGameSearchChange,
  onGameSelect,
  onActiveIndexChange,
  onCheckout,
}: CheckoutFormProps) {
  const sessionFieldId = useId();
  const gameFieldId = useId();
  const options = filteredGames.slice(0, 10);
  const isOpen = !!(gameSearch && !selectedGame);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        <ArrowLeftRight size={18} className="inline mr-2" />
        Check Out a Game
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor={sessionFieldId} className="block text-sm font-medium text-gray-700 mb-1">Active Session</label>
          <select
            id={sessionFieldId}
            value={selectedSession || ""}
            onChange={(e) => onSessionChange(parseInt(e.target.value) || null)}
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
        <div className="relative">
          <label htmlFor={gameFieldId} className="block text-sm font-medium text-gray-700 mb-1">Game</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id={gameFieldId}
              type="text"
              placeholder="Search games..."
              value={gameSearch}
              onChange={(e) => onGameSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (!isOpen) return;

                switch (e.key) {
                  case "ArrowDown":
                    e.preventDefault();
                    onActiveIndexChange((prev) => Math.min(prev + 1, options.length - 1));
                    break;
                  case "ArrowUp":
                    e.preventDefault();
                    onActiveIndexChange((prev) => Math.max(prev - 1, 0));
                    break;
                  case "Enter":
                    e.preventDefault();
                    if (activeIndex >= 0 && activeIndex < options.length) {
                      const selected = options[activeIndex];
                      if (selected) {
                        onGameSelect(selected.id, selected.title);
                      }
                    }
                    break;
                  case "Escape":
                    e.preventDefault();
                    onGameSearchChange("");
                    break;
                }
              }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              role="combobox"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="game-search-listbox"
              aria-activedescendant={activeIndex >= 0 ? `game-option-${options[activeIndex]?.id}` : undefined}
            />
          </div>
          {isOpen && (
            <div
              id="game-search-listbox"
              className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10"
              role="listbox"
            >
              {options.map((g, index) => (
                <button
                  key={g.id}
                  id={`game-option-${g.id}`}
                  onClick={() => onGameSelect(g.id, g.title)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-violet-50 flex justify-between focus-visible:outline-none focus-visible:bg-violet-50 ${
                    index === activeIndex ? "bg-violet-50" : ""
                  }`}
                  role="option"
                  aria-selected={index === activeIndex}
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
            onClick={onCheckout}
            disabled={!selectedSession || !selectedGame || isSubmitting}
            aria-busy={isSubmitting}
            className="w-full bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Checking Out…" : "Check Out Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
