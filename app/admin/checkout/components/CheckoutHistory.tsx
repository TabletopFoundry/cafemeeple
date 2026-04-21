"use client";

import { Badge } from "@/components/ui";
import type { Checkout } from "@/lib/types";

interface CheckoutHistoryProps {
  checkouts: Checkout[];
}

function getConditionVariant(condition: string | null) {
  if (condition === "Good" || condition === "Excellent") return "success";
  if (condition === "Fair") return "warning";
  return "danger";
}

export default function CheckoutHistory({ checkouts }: CheckoutHistoryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Game</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Table</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Checked Out</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Returned</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Condition</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {checkouts.map((co) => (
            <tr key={co.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{co.game_title}</p>
              </td>
              <td className="px-4 py-3 text-gray-600">{co.table_name}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {new Date(co.checked_out_at.replace(" ", "T")).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {co.returned_at ? new Date(co.returned_at.replace(" ", "T")).toLocaleString() : "-"}
              </td>
              <td className="px-4 py-3">
                <Badge variant={getConditionVariant(co.return_condition)}>{co.return_condition || "-"}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
