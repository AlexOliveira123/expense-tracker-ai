"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, subDays } from "date-fns";
import { Expense } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍔",
  Transportation: "🚗",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Bills: "💡",
  Other: "📦",
};

interface Props {
  expenses: Expense[];
}

function computeStreak(expenses: Expense[]): number {
  const days = new Set(expenses.map((e) => e.date));
  let streak = 0;
  let d = new Date();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = format(d, "yyyy-MM-dd");
    if (!days.has(key)) break;
    streak++;
    d = subDays(d, 1);
  }
  return streak;
}

export function MonthlyInsights({ expenses }: Props) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthExpenses = useMemo(
    () =>
      expenses.filter((e) =>
        isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses]
  );

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of monthExpenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([category, total]) => ({ category, total }));
  }, [monthExpenses]);

  const top3 = categoryTotals.slice(0, 3);

  const donutData = categoryTotals.map((c) => ({
    name: c.category,
    value: c.total,
    color: CATEGORY_COLORS[c.category as keyof typeof CATEGORY_COLORS] ?? "#6b7280",
  }));

  const streak = useMemo(() => computeStreak(expenses), [expenses]);

  if (monthExpenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Monthly Insights</h2>
        <p className="text-gray-400 text-sm">No expenses recorded this month yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 text-center">Monthly Insights</h2>

      {/* Donut chart with center label */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {donutData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-full px-2.5 py-1 shadow-sm">
            Spending
          </span>
        </div>
      </div>

      {/* Top 3 categories */}
      <div className="space-y-2.5">
        {top3.map(({ category, total }) => (
          <div key={category} className="flex items-center gap-3">
            <div
              className="w-1 h-5 rounded-full flex-shrink-0"
              style={{
                backgroundColor:
                  CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? "#6b7280",
              }}
            />
            <span className="text-sm text-gray-700">
              {CATEGORY_EMOJI[category] ?? "💰"} {category}:{" "}
              <span className="font-medium">{formatCurrency(total)}</span>
            </span>
          </div>
        ))}
        <p className="text-xs text-gray-400 text-right pr-1">Top {top3.length}</p>
      </div>

      {/* Budget Streak */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-700 text-center mb-3">Budget Streak</p>
        <div className="flex items-center justify-center gap-5">
          <div className="text-center leading-tight">
            <p className="text-4xl font-bold text-green-500">{streak}</p>
            <p className="text-sm text-gray-500 mt-0.5">days!</p>
          </div>
          {/* Progress pill */}
          <div className="w-20 h-7 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
