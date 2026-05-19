"use client";

import { useId, useState, type FormEvent } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { MAX_TEXT_LENGTHS } from "@/lib/constants";
import type { Table } from "@/lib/types";

interface CheckInModalProps {
  tables: Table[];
  initialTableId?: number | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CheckInModal({
  tables,
  initialTableId,
  onClose,
  onSaved,
}: CheckInModalProps) {
  if (tables.length === 0) {
    return (
      <Modal title="Seat a new party" onClose={onClose}>
        <div className="p-6 text-center text-gray-500">
          <p>No tables are currently available.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <CheckInForm
      tables={tables}
      initialTableId={initialTableId}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function CheckInForm({
  tables,
  initialTableId,
  onClose,
  onSaved,
}: CheckInModalProps) {
  const defaultTableId =
    tables.find((table) => table.id === initialTableId)?.id ?? tables[0]?.id ?? 0;
  const tableId = useId();
  const partyNameId = useId();
  const guestCountId = useId();
  const rateTypeId = useId();
  const coverChargeId = useId();
  const [form, setForm] = useState({
    table_id: defaultTableId,
    party_name: "",
    party_size: 2,
    rate_type: "per_person",
    cover_charge_per_person: 5,
  });
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const selectedTable = tables.find((table) => table.id === form.table_id);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(json?.error || "Failed to check in party");
      }

      onSaved();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Failed to check in party",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Seat a new party"
      subtitle={selectedTable ? `${selectedTable.name} · ${selectedTable.section}` : undefined}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <label htmlFor={tableId} className="mb-1 block text-sm font-medium text-gray-700">
            Table
          </label>
          <select
            id={tableId}
            value={form.table_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                table_id: Number(event.target.value),
              }))
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
          >
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name} · {table.capacity} seats · {table.section}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={partyNameId} className="mb-1 block text-sm font-medium text-gray-700">
              Party name
            </label>
            <input
              id={partyNameId}
              value={form.party_name}
              maxLength={MAX_TEXT_LENGTHS.partyName}
              onChange={(event) =>
                setForm((current) => ({ ...current, party_name: event.target.value }))
              }
              placeholder="Walk-in"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor={guestCountId} className="mb-1 block text-sm font-medium text-gray-700">
              Guest count
            </label>
            <input
              id={guestCountId}
              type="number"
              min={1}
              max={selectedTable?.capacity ?? 12}
              value={form.party_size}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  party_size: Number(event.target.value) || 1,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={rateTypeId} className="mb-1 block text-sm font-medium text-gray-700">
              Rate model
            </label>
            <select
              id={rateTypeId}
              value={form.rate_type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rate_type: event.target.value,
                  cover_charge_per_person: event.target.value === "per_table" ? 24 : 5,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            >
              <option value="per_person">Per person</option>
              <option value="per_table">Per table</option>
            </select>
          </div>
          <div>
            <label htmlFor={coverChargeId} className="mb-1 block text-sm font-medium text-gray-700">
              {form.rate_type === "per_person" ? "Rate per guest" : "Rate per table"}
            </label>
            <input
              id={coverChargeId}
              type="number"
              min={1}
              step={0.5}
              value={form.cover_charge_per_person}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cover_charge_per_person: Number(event.target.value) || 0,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
            />
          </div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Estimated cover charge</p>
          <p className="mt-1 text-lg font-semibold text-violet-700">
            ${
              (
                form.rate_type === "per_person"
                  ? form.party_size * form.cover_charge_per_person
                  : form.cover_charge_per_person
              ).toFixed(2)
            }
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {selectedTable
              ? `${selectedTable.name} seats up to ${selectedTable.capacity} guests.`
              : "Select a table."}
          </p>
        </div>
        <div className="flex justify-end gap-3">
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
            {saving ? "Starting session..." : "Start timer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
