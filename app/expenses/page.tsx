"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { useExpenseContext } from "../providers";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseFiltersBar } from "@/components/ExpenseFilters";
import { ExpenseFilters } from "@/lib/types";
import { filterExpenses, exportToCSV, formatCurrency } from "@/lib/utils";

const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  dateFrom: "",
  dateTo: "",
};

export default function ExpensesPage() {
  const { expenses, loaded, updateExpense, deleteExpense } = useExpenseContext();
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);

  const filtered = useMemo(() => filterExpenses(expenses, filters), [expenses, filters]);
  const filteredTotal = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""} · {formatCurrency(filteredTotal)}
          </p>
        </div>
        <button
          onClick={() => exportToCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      <ExpenseFiltersBar filters={filters} onChange={setFilters} />

      <ExpenseList
        expenses={filtered}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
      />
    </div>
  );
}
