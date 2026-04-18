"use client";

import { Undo2 } from "lucide-react";
import type { Checkout } from "@/lib/types";

interface CheckoutTableProps {
  checkouts: Checkout[];
  onReturn: (checkout: Checkout) => void;
}

export default function CheckoutTable({ checkouts, onReturn }: CheckoutTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Game</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Table</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Party</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Checked Out</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {checkouts.map((co) => (
            <tr key={co.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{co.game_title}</p>
                <p className="text-xs text-gray-500">{co.game_category}</p>
              </td>
              <td className="px-4 py-3 text-gray-600">{co.table_name}</td>
              <td className="px-4 py-3 text-gray-600">{co.party_name}</td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(co.checked_out_at.replace(" ", "T")).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onReturn(co)}
                  className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 text-sm font-medium"
                >
                  <Undo2 size={14} />
                  Return
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
