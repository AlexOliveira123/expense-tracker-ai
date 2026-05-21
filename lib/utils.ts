import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { Expense, CategorySummary, ExpenseFilters } from "./types";
import { CATEGORY_COLORS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  return expenses.filter((e) => {
    if (filters.category !== "All" && e.category !== filters.category) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!e.description.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false;
    }
    if (filters.dateFrom && e.date < filters.dateFrom) return false;
    if (filters.dateTo && e.date > filters.dateTo) return false;
    return true;
  });
}

export function getMonthlyTotal(expenses: Expense[]): number {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return expenses
    .filter((e) => isWithinInterval(parseISO(e.date), { start, end }))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getCategorySummaries(expenses: Expense[]): CategorySummary[] {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const map: Record<string, { total: number; count: number }> = {};
  for (const e of expenses) {
    if (!map[e.category]) map[e.category] = { total: 0, count: 0 };
    map[e.category].total += e.amount;
    map[e.category].count += 1;
  }
  return Object.entries(map)
    .map(([category, data]) => ({
      category: category as CategorySummary["category"],
      total: data.total,
      count: data.count,
      percentage: total > 0 ? (data.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getMonthlyChartData(expenses: Expense[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    const month = e.date.slice(0, 7); // YYYY-MM
    map[month] = (map[month] || 0) + e.amount;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({
      month: format(parseISO(`${month}-01`), "MMM yy"),
      total,
    }));
}

export function getCategoryChartData(expenses: Expense[]) {
  const summaries = getCategorySummaries(expenses);
  return summaries.map((s) => ({
    name: s.category,
    value: s.total,
    color: CATEGORY_COLORS[s.category],
  }));
}

export function exportToCSV(expenses: Expense[]): void {
  const headers = ["Date", "Description", "Category", "Amount"];
  const rows = expenses.map((e) => [
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    e.category,
    e.amount.toFixed(2),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
