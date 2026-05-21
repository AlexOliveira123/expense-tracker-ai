"use client";

import { TrendingUp, Calendar, Tag, DollarSign } from "lucide-react";
import { Expense } from "@/lib/types";
import { formatCurrency, getMonthlyTotal, getCategorySummaries } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  expenses: Expense[];
}

export function SummaryCards({ expenses }: Props) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyTotal = getMonthlyTotal(expenses);
  const summaries = getCategorySummaries(expenses);
  const topCategory = summaries[0];
  const avgExpense = expenses.length > 0 ? total / expenses.length : 0;

  const cards = [
    {
      label: "Total Spending",
      value: formatCurrency(total),
      sub: `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`,
      icon: DollarSign,
      color: "bg-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: `${format(new Date(), "MMMM")} Spending`,
      value: formatCurrency(monthlyTotal),
      sub: "This month",
      icon: Calendar,
      color: "bg-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "Top Category",
      value: topCategory?.category ?? "—",
      sub: topCategory ? formatCurrency(topCategory.total) : "No data",
      icon: Tag,
      color: "bg-amber-500",
      bg: "bg-amber-50",
    },
    {
      label: "Avg per Expense",
      value: formatCurrency(avgExpense),
      sub: "All time",
      icon: TrendingUp,
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
            <c.icon size={20} className={c.color.replace("bg-", "text-")} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-0.5">{c.value}</p>
          <p className="text-xs text-gray-500 font-medium">{c.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
