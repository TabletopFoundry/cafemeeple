"use client";

import Image from "next/image";
import { AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui";
import type { Game } from "@/lib/types";

interface GameListTableProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (id: number) => void;
}

const formatDate = (value: string) => new Date(value.replace(" ", "T")).toLocaleDateString();

export default function GameListTable({ games, onEdit, onDelete }: GameListTableProps) {
  return (
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
                      {game.image_url ? <Image src={game.image_url} alt={game.title} fill className="object-cover" sizes="48px" /> : null}
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
                <td className="px-4 py-4 text-gray-600">{game.min_players}-{game.max_players}</td>
                <td className="px-4 py-4 text-gray-600">{game.complexity.toFixed(1)}</td>
                <td className="px-4 py-4">
                  <Badge variant={game.condition_score <= 2 ? "warning" : "info"}>{game.condition} ({game.condition_score}/5)</Badge>
                </td>
                <td className="px-4 py-4 text-gray-600">{game.copies_available}/{game.copies_total}</td>
                <td className="px-4 py-4 text-gray-600">{game.checkout_count} / threshold {game.replacement_threshold}</td>
                <td className="px-4 py-4 text-gray-600">{formatDate(game.last_inspected_at)}</td>
                <td className="px-4 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button onClick={() => onEdit(game)} className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-violet-200 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" aria-label={`Edit ${game.title}`}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(game.id)} className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" aria-label={`Delete ${game.title}`}>
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
  );
}
