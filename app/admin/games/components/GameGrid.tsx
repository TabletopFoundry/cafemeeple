"use client";

import Image from "next/image";
import { Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui";
import type { Game } from "@/lib/types";

interface GameGridProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (id: number) => void;
}

const formatDate = (value: string) => new Date(value.replace(" ", "T")).toLocaleDateString();

export default function GameGrid({ games, onEdit, onDelete }: GameGridProps) {
  return (
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
                <dd>{game.copies_available}/{game.copies_total} available</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Checkouts</dt>
                <dd>{game.checkout_count}</dd>
              </div>
            </dl>
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs text-gray-400">Last inspected</p>
                <p className="text-sm text-gray-600">{formatDate(game.last_inspected_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEdit(game)} className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-violet-200 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" aria-label={`Edit ${game.title}`}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => onDelete(game.id)} className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" aria-label={`Delete ${game.title}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
