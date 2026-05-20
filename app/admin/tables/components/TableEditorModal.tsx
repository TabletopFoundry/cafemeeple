"use client";

import { useId, useState } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import {
  TABLE_LAYOUT_LIMITS,
  TABLE_SECTIONS,
  VALID_TABLE_SHAPES,
} from "@/lib/constants";
import type { Table } from "@/lib/types";

export interface TableFormValues {
  name: string;
  capacity: number;
  section: (typeof TABLE_SECTIONS)[number];
  shape: (typeof VALID_TABLE_SHAPES)[number];
  x_position: number;
  y_position: number;
  status: "available" | "maintenance";
}

interface TableEditorModalProps {
  table: Table | null;
  onClose: () => void;
  onSubmit: (form: TableFormValues, tableId: number | null) => Promise<void>;
}

const DEFAULT_FORM: TableFormValues = {
  name: "",
  capacity: 4,
  section: TABLE_SECTIONS[0],
  shape: VALID_TABLE_SHAPES[0],
  x_position: 120,
  y_position: 120,
  status: "available",
};

export default function TableEditorModal({
  table,
  onClose,
  onSubmit,
}: TableEditorModalProps) {
  const nameId = useId();
  const capacityId = useId();
  const sectionId = useId();
  const shapeId = useId();
  const xId = useId();
  const yId = useId();
  const statusId = useId();
  const [form, setForm] = useState<TableFormValues>({
    name: table?.name ?? DEFAULT_FORM.name,
    capacity: table?.capacity ?? DEFAULT_FORM.capacity,
    section: (table?.section as (typeof TABLE_SECTIONS)[number]) ?? DEFAULT_FORM.section,
    shape: (table?.shape as (typeof VALID_TABLE_SHAPES)[number]) ?? DEFAULT_FORM.shape,
    x_position: table?.x_position ?? DEFAULT_FORM.x_position,
    y_position: table?.y_position ?? DEFAULT_FORM.y_position,
    status: table?.status === "maintenance" ? "maintenance" : "available",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Table name is required";
    if (form.capacity < 1) nextErrors.capacity = "Capacity must be at least 1";
    if (form.x_position < 0 || form.x_position > TABLE_LAYOUT_LIMITS.maxX) {
      nextErrors.x_position = `X must be between 0 and ${TABLE_LAYOUT_LIMITS.maxX}`;
    }
    if (form.y_position < 0 || form.y_position > TABLE_LAYOUT_LIMITS.maxY) {
      nextErrors.y_position = `Y must be between 0 and ${TABLE_LAYOUT_LIMITS.maxY}`;
    }
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(form, table?.id ?? null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to save table", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={table ? `Edit ${table.name}` : "Add table"}
      subtitle={
        table
          ? `Live status: ${table.status}. Use maintenance mode to manually block a table.`
          : "Add a new table to the café floor plan."
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <label htmlFor={nameId} className="mb-1 block text-sm font-medium text-gray-700">
              Table name
            </label>
            <input
              id={nameId}
              value={form.name}
              onChange={(event) => {
                setForm((current) => ({ ...current, name: event.target.value }));
                setErrors((current) => {
                  const next = { ...current };
                  delete next.name;
                  return next;
                });
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2 ${errors.name ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor={capacityId} className="mb-1 block text-sm font-medium text-gray-700">
              Seats
            </label>
            <input
              id={capacityId}
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  capacity: Number(event.target.value) || 1,
                }));
                setErrors((current) => {
                  const next = { ...current };
                  delete next.capacity;
                  return next;
                });
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2 ${errors.capacity ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.capacity && (
              <p className="mt-1 text-xs text-red-600">{errors.capacity}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor={sectionId} className="mb-1 block text-sm font-medium text-gray-700">
              Section
            </label>
            <select
              id={sectionId}
              value={form.section}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  section: event.target.value as (typeof TABLE_SECTIONS)[number],
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            >
              {TABLE_SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={shapeId} className="mb-1 block text-sm font-medium text-gray-700">
              Shape
            </label>
            <select
              id={shapeId}
              value={form.shape}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  shape: event.target.value as (typeof VALID_TABLE_SHAPES)[number],
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            >
              {VALID_TABLE_SHAPES.map((shape) => (
                <option key={shape} value={shape}>
                  {shape}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={statusId} className="mb-1 block text-sm font-medium text-gray-700">
              Manual state
            </label>
            <select
              id={statusId}
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as TableFormValues["status"],
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            >
              <option value="available">Operational</option>
              <option value="maintenance">Under maintenance</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={xId} className="mb-1 block text-sm font-medium text-gray-700">
              Layout X
            </label>
            <input
              id={xId}
              type="number"
              min={0}
              max={TABLE_LAYOUT_LIMITS.maxX}
              value={form.x_position}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  x_position: Number(event.target.value) || 0,
                }));
                setErrors((current) => {
                  const next = { ...current };
                  delete next.x_position;
                  return next;
                });
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2 ${errors.x_position ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.x_position && (
              <p className="mt-1 text-xs text-red-600">{errors.x_position}</p>
            )}
          </div>
          <div>
            <label htmlFor={yId} className="mb-1 block text-sm font-medium text-gray-700">
              Layout Y
            </label>
            <input
              id={yId}
              type="number"
              min={0}
              max={TABLE_LAYOUT_LIMITS.maxY}
              value={form.y_position}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  y_position: Number(event.target.value) || 0,
                }));
                setErrors((current) => {
                  const next = { ...current };
                  delete next.y_position;
                  return next;
                });
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2 ${errors.y_position ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.y_position && (
              <p className="mt-1 text-xs text-red-600">{errors.y_position}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Layout guidance</p>
          <p className="mt-1">
            Use the X and Y fields to spread tables across the floor-plan canvas and keep seating areas easy to scan.
          </p>
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
            {saving ? "Saving..." : table ? "Save table" : "Add table"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
