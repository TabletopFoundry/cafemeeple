"use client";

import { useId } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { CONDITION_LABELS } from "@/lib/game-utils";

interface GameFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: readonly string[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  conditionFilter: string;
  onConditionFilterChange: (value: string) => void;
  complexityFilter: string;
  onComplexityFilterChange: (value: string) => void;
  playerCountFilter: string;
  onPlayerCountFilterChange: (value: string) => void;
  replacementOnly: boolean;
  onReplacementOnlyChange: (value: boolean) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
}

export default function GameFilterBar({
  search,
  onSearchChange,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  conditionFilter,
  onConditionFilterChange,
  complexityFilter,
  onComplexityFilterChange,
  playerCountFilter,
  onPlayerCountFilterChange,
  replacementOnly,
  onReplacementOnlyChange,
  activeFilterCount,
  onResetFilters,
}: GameFilterBarProps) {
  const searchId = useId();
  const categoryId = useId();
  const conditionId = useId();
  const complexityId = useId();
  const playerCountId = useId();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="grid gap-3 xl:grid-cols-[1.6fr_repeat(5,minmax(0,1fr))]">
        <label htmlFor={searchId} className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id={searchId}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title, category, or shelf"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none ring-violet-500 transition focus:ring-2"
          />
        </label>
        <div>
          <label htmlFor={categoryId} className="sr-only">Filter by category</label>
          <select id={categoryId} value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          </select>
        </div>
        <div>
          <label htmlFor={conditionId} className="sr-only">Filter by condition</label>
          <select id={conditionId} value={conditionFilter} onChange={(event) => onConditionFilterChange(event.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
          <option value="">All conditions</option>
          {CONDITION_LABELS.map((condition) => (
            <option key={condition} value={condition}>
              {condition}
            </option>
          ))}
          </select>
        </div>
        <div>
          <label htmlFor={complexityId} className="sr-only">Filter by complexity</label>
          <select id={complexityId} value={complexityFilter} onChange={(event) => onComplexityFilterChange(event.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
          <option value="">All complexity</option>
          <option value="light">Light (under 2.0)</option>
          <option value="mid">Midweight (2.0-3.1)</option>
          <option value="heavy">Heavy (3.2+)</option>
          </select>
        </div>
        <div>
          <label htmlFor={playerCountId} className="sr-only">Filter by player count</label>
          <select id={playerCountId} value={playerCountFilter} onChange={(event) => onPlayerCountFilterChange(event.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
          <option value="">Any player count</option>
          {[2, 3, 4, 5, 6, 8].map((count) => (
            <option key={count} value={count}>
              Seats {count}
            </option>
          ))}
          </select>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
          <input type="checkbox" checked={replacementOnly} onChange={(event) => onReplacementOnlyChange(event.target.checked)} />
          <AlertTriangle size={14} className="text-amber-500" /> Needs replacement
        </label>
      </div>
      <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {activeFilterCount === 0
            ? "No filters active."
            : `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active.`}
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          disabled={activeFilterCount === 0}
          className="w-fit rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
