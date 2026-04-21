"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import { formatElapsed } from "@/lib/date-utils";
import type { Session } from "@/lib/types";

interface CheckoutModalProps {
  session: Session;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CheckoutModal({
  session,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  return (
    <>
      <Modal title="Billing summary" subtitle={session.table_name} onClose={onClose} size="sm">
        <div className="space-y-4 p-6 text-sm text-gray-600">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-medium text-gray-900">{session.party_name || "Walk-in"}</p>
            <p className="mt-1">
              {session.party_size} guests · {formatElapsed(session.started_at)} elapsed
            </p>
          </div>
          <div className="space-y-2">
            <SummaryRow
              label="Rate type"
              value={session.rate_type === "per_person" ? "Per person" : "Per table"}
            />
            <SummaryRow
              label="Rate amount"
              value={`$${session.cover_charge_per_person.toFixed(2)}`}
            />
            <SummaryRow label="Games checked out" value={String(session.active_games)} />
            <SummaryRow
              label="Total due"
              value={`$${session.running_total.toFixed(2)}`}
              emphasis
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Keep open
            </button>
            <button
              type="button"
              onClick={() => setShowCloseConfirm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <LogOut size={14} aria-hidden="true" /> Close session
            </button>
          </div>
        </div>
      </Modal>
      {showCloseConfirm && (
        <ConfirmDialog
          title="Close session"
          message={`End the billing session for ${session.party_name || "Walk-in"} at ${session.table_name}? This will free the table and finalize the charge of $${session.running_total.toFixed(2)}.`}
          confirmLabel="Close session"
          variant="warning"
          onConfirm={() => {
            setShowCloseConfirm(false);
            onConfirm();
          }}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
    </>
  );
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={emphasis ? "font-semibold text-gray-900" : "text-gray-700"}>
        {value}
      </span>
    </div>
  );
}
