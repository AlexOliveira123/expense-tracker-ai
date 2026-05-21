"use client";

import { useState } from "react";
import { useExpenseContext } from "./providers";
import { SummaryCards } from "@/components/SummaryCards";
import { SpendingCharts } from "@/components/SpendingCharts";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { ExpenseList } from "@/components/ExpenseList";
import { ExportDrawer } from "@/components/ExportDrawer";
import { CloudUpload, Plus } from "lucide-react";

export default function DashboardPage() {
  const { expenses, loaded, updateExpense, deleteExpense, openAddModal } = useExpenseContext();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const recent = expenses.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your financial overview at a glance</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm shadow-blue-200"
        >
          <CloudUpload size={15} />
          Sync & Export
        </button>
      </div>

      <ExportDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        expenses={expenses}
      />

      <SummaryCards expenses={expenses} />
      <SpendingCharts expenses={expenses} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Expenses</h3>
              {expenses.length > 5 && (
                <a href="/expenses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all →
                </a>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm mb-3">No expenses yet</p>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus size={15} /> Add your first expense
                </button>
              </div>
            ) : (
              <ExpenseList
                expenses={recent}
                onUpdate={updateExpense}
                onDelete={deleteExpense}
              />
            )}
          </div>
        </div>
        <div>
          <CategoryBreakdown expenses={expenses} />
        </div>
      </div>
    </div>
  );
}
