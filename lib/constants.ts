import { Category } from "./types";

export const CATEGORIES: Category[] = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#f59e0b",
  Transportation: "#3b82f6",
  Entertainment: "#8b5cf6",
  Shopping: "#ec4899",
  Bills: "#ef4444",
  Other: "#6b7280",
};

export const CATEGORY_BG: Record<Category, string> = {
  Food: "bg-amber-100 text-amber-800",
  Transportation: "bg-blue-100 text-blue-800",
  Entertainment: "bg-purple-100 text-purple-800",
  Shopping: "bg-pink-100 text-pink-800",
  Bills: "bg-red-100 text-red-800",
  Other: "bg-gray-100 text-gray-700",
};

export const STORAGE_KEY = "expense_tracker_data";
