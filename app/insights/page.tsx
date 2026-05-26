"use client";

import { useExpenseContext } from "../providers";
import { MonthlyInsights } from "@/components/MonthlyInsights";

export default function InsightsPage() {
  const { expenses, loaded } = useExpenseContext();

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your monthly spending breakdown</p>
      </div>
      <div className="max-w-sm mx-auto">
        <MonthlyInsights expenses={expenses} />
      </div>
    </div>
  );
}
