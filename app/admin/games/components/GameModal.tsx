"use client";

import { useId, useState, type FormEvent } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { MAX_TEXT_LENGTHS } from "@/lib/constants";
import {
  CONDITION_LABELS,
  conditionLabelForScore,
  conditionScoreForLabel,
} from "@/lib/game-utils";
import type { Game, GameCondition } from "@/lib/types";
import NumberField from "./NumberField";

interface GameModalProps {
  game: Game | null;
  categories: readonly string[];
  onClose: () => void;
  onSaved: () => void;
}

interface GameFormState {
  title: string;
  min_players: number;
  max_players: number;
  play_time_minutes: number;
  complexity: number;
  category: string;
  description: string;
  image_url: string;
  copies_total: number;
  condition: GameCondition;
  condition_score: number;
  shelf_location: string;
  replacement_threshold: number;
}

export default function GameModal({ game, categories, onClose, onSaved }: GameModalProps) {
  const titleId = useId();
  const categoryId = useId();
  const shelfLocationId = useId();
  const imageUrlId = useId();
  const complexityId = useId();
  const conditionId = useId();
  const notesId = useId();
  const [form, setForm] = useState<GameFormState>({
    title: game?.title || "",
    min_players: game?.min_players || 1,
    max_players: game?.max_players || 4,
    play_time_minutes: game?.play_time_minutes || 30,
    complexity: game?.complexity || 2.5,
    category: game?.category || "Strategy",
    description: game?.description || "",
    image_url: game?.image_url || "",
    copies_total: game?.copies_total || 1,
    condition: game?.condition || "Good",
    condition_score: game?.condition_score || 4,
    shelf_location: game?.shelf_location || "",
    replacement_threshold: game?.replacement_threshold || 12,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = "Title is required";
    if (form.min_players > form.max_players) nextErrors.max_players = "Max players must be ≥ min players";
    if (form.min_players < 1) nextErrors.min_players = "Min players must be at least 1";
    if (form.copies_total < 1) nextErrors.copies_total = "Must have at least 1 copy";
    if (form.play_time_minutes < 1) nextErrors.play_time_minutes = "Play time must be positive";
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSaving(true);

    try {
      const response = await fetch(game ? `/api/games/${game.id}` : "/api/games", {
        method: game ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to save game");
      }
      onSaved();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to save game", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={game ? "Edit game" : "Add game"} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <label htmlFor={titleId} className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input
            id={titleId}
            required
            maxLength={MAX_TEXT_LENGTHS.gameTitle}
            value={form.title}
            onChange={(event) => {
              setForm({ ...form, title: event.target.value });
              setErrors((prev) => {
                const next = { ...prev };
                delete next.title;
                return next;
              });
            }}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2 ${errors.title ? "border-red-400" : "border-gray-200"}`}
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={categoryId} className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select id={categoryId} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={shelfLocationId} className="mb-1 block text-sm font-medium text-gray-700">Shelf location</label>
            <input id={shelfLocationId} maxLength={MAX_TEXT_LENGTHS.shelfLocation} value={form.shelf_location} onChange={(event) => setForm({ ...form, shelf_location: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
          <div>
            <label htmlFor={imageUrlId} className="mb-1 block text-sm font-medium text-gray-700">Cover image URL</label>
            <input
              id={imageUrlId}
              type="url"
              maxLength={MAX_TEXT_LENGTHS.imageUrl}
              value={form.image_url}
              onChange={(event) => setForm({ ...form, image_url: event.target.value })}
              placeholder="https://… or data:image/..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              This powers the cover art shown in the game grid and list views.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Preview</p>
            <div className="mt-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-white">
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview must support arbitrary URLs and inline data URIs
                <img src={form.image_url} alt="Game cover preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl" aria-hidden="true">🎲</span>
              )}
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <NumberField label="Min players" value={form.min_players} onChange={(value) => setForm({ ...form, min_players: value })} />
            {errors.min_players && <p className="mt-1 text-xs text-red-600">{errors.min_players}</p>}
          </div>
          <div>
            <NumberField label="Max players" value={form.max_players} onChange={(value) => setForm({ ...form, max_players: value })} />
            {errors.max_players && <p className="mt-1 text-xs text-red-600">{errors.max_players}</p>}
          </div>
          <div>
            <NumberField label="Play time" value={form.play_time_minutes} onChange={(value) => setForm({ ...form, play_time_minutes: value })} suffix="min" />
            {errors.play_time_minutes && <p className="mt-1 text-xs text-red-600">{errors.play_time_minutes}</p>}
          </div>
          <div>
            <label htmlFor={complexityId} className="mb-1 block text-sm font-medium text-gray-700">Complexity</label>
            <input
              id={complexityId}
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
          <div>
            <NumberField label="Copies" value={form.copies_total} onChange={(value) => setForm({ ...form, copies_total: value })} />
            {errors.copies_total && <p className="mt-1 text-xs text-red-600">{errors.copies_total}</p>}
          </div>
          <NumberField
            label="Condition score"
            value={form.condition_score}
            onChange={(value) =>
              setForm({
                ...form,
                condition_score: value,
                condition: conditionLabelForScore(value),
              })
            }
            min={1}
            max={5}
          />
          <NumberField label="Replacement threshold" value={form.replacement_threshold} onChange={(value) => setForm({ ...form, replacement_threshold: value })} min={1} />
        </div>
        <div>
          <label htmlFor={conditionId} className="mb-1 block text-sm font-medium text-gray-700">Condition label</label>
          <select id={conditionId} value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value as GameCondition, condition_score: conditionScoreForLabel(event.target.value) })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2">
            {CONDITION_LABELS.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={notesId} className="mb-1 block text-sm font-medium text-gray-700">Internal notes</label>
          <textarea id={notesId} maxLength={MAX_TEXT_LENGTHS.gameDescription} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2" />
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60">
            {saving ? "Saving..." : game ? "Save changes" : "Add game"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
