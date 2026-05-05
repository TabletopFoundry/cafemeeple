"use client";

import { useId, useState } from "react";
import Modal from "@/components/Modal";
import { CONDITION_LABELS } from "@/lib/game-utils";
import { MAX_TEXT_LENGTHS } from "@/lib/constants";
import type { Checkout } from "@/lib/types";

interface ReturnModalProps {
  checkout: Checkout;
  onClose: () => void;
  onReturn: (id: number, condition: string, notes: string) => void;
}

export default function ReturnModal({ checkout, onClose, onReturn }: ReturnModalProps) {
  const conditionId = useId();
  const notesId = useId();
  const [condition, setCondition] = useState("Good");
  const [notes, setNotes] = useState("");

  return (
    <Modal title={`Return: ${checkout.game_title}`} onClose={onClose} size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor={conditionId} className="block text-sm font-medium text-gray-700 mb-1">Return Condition</label>
          <select
            id={conditionId}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {CONDITION_LABELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={notesId} className="block text-sm font-medium text-gray-700 mb-1">Notes (missing pieces, damage, etc.)</label>
          <textarea
            id={notesId}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={MAX_TEXT_LENGTHS.checkoutNotes}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Optional notes about game condition..."
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onReturn(checkout.id, condition, notes)}
            className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700"
          >
            Return Game
          </button>
        </div>
      </div>
    </Modal>
  );
}
