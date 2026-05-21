import { Expense } from "./types";
import { STORAGE_KEY } from "./constants";
import { SEED_EXPENSES } from "./seedData";

export function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // First visit: seed with demo data
    saveExpenses(SEED_EXPENSES);
    return SEED_EXPENSES;
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}
