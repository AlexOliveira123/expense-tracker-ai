"use client";

import { Expense } from "@/lib/types";
import { getCategorySummaries, formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_BG } from "@/lib/constants";

interface Props {
  expenses: Expense[];
}

export function CategoryBreakdown({ expenses }: Props) {
  const summaries = getCategorySummaries(expenses);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Category Breakdown</h3>
      {summaries.length === 0 ? (
        <p className="text-gray-400 text-sm">No data yet</p>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => (
            <div key={s.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{s.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{s.count} item{s.count !== 1 ? "s" : ""}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(s.total)}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${s.percentage}%`,
                    backgroundColor: CATEGORY_COLORS[s.category],
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{s.percentage.toFixed(1)}% of total</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
