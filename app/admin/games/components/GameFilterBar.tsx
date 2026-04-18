"use client";

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
}: GameFilterBarProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="grid gap-3 xl:grid-cols-[1.6fr_repeat(5,minmax(0,1fr))]">
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title, category, or shelf"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none ring-violet-500 transition focus:ring-2"
          />
        </label>
        <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select value={conditionFilter} onChange={(event) => onConditionFilterChange(event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
          <option value="">All conditions</option>
          {CONDITION_LABELS.map((condition) => (
            <option key={condition} value={condition}>
              {condition}
            </option>
          ))}
        </select>
        <select value={complexityFilter} onChange={(event) => onComplexityFilterChange(event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
          <option value="">All complexity</option>
          <option value="light">Light (under 2.0)</option>
          <option value="mid">Midweight (2.0-3.1)</option>
          <option value="heavy">Heavy (3.2+)</option>
        </select>
        <select value={playerCountFilter} onChange={(event) => onPlayerCountFilterChange(event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
          <option value="">Any player count</option>
          {[2, 3, 4, 5, 6, 8].map((count) => (
            <option key={count} value={count}>
              Seats {count}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
          <input type="checkbox" checked={replacementOnly} onChange={(event) => onReplacementOnlyChange(event.target.checked)} />
          <AlertTriangle size={14} className="text-amber-500" /> Needs replacement
        </label>
      </div>
    </div>
  );
}
