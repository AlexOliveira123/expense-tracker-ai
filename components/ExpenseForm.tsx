"use client";

import { useState } from "react";
import { Expense, Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ExpenseFormProps {
  onSubmit: (data: Omit<Expense, "id" | "createdAt">) => void;
  onCancel: () => void;
  initial?: Expense;
}

const empty = {
  date: format(new Date(), "yyyy-MM-dd"),
  amount: "",
  category: "Food" as Category,
  description: "",
};

export function ExpenseForm({ onSubmit, onCancel, initial }: ExpenseFormProps) {
  const [form, setForm] = useState({
    date: initial?.date ?? empty.date,
    amount: initial ? String(initial.amount) : "",
    category: initial?.category ?? empty.category,
    description: initial?.description ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.date) errs.date = "Date is required";
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = "Enter a valid amount";
    if (amt > 1_000_000) errs.amount = "Amount too large";
    if (!form.description.trim()) errs.description = "Description is required";
    if (form.description.trim().length > 200) errs.description = "Max 200 characters";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({
      date: form.date,
      amount: parseFloat(parseFloat(form.amount).toFixed(2)),
      category: form.category as Category,
      description: form.description.trim(),
    });
  }

  function field(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setErrors((p) => ({ ...p, [key]: "" }));
    };
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={field("date")}
            max={format(new Date(), "yyyy-MM-dd")}
            className={cn(
              "w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow",
              errors.date ? "border-red-400" : "border-gray-200"
            )}
          />
          {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount ($)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={field("amount")}
            className={cn(
              "w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow",
              errors.amount ? "border-red-400" : "border-gray-200"
            )}
          />
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
        <select
          value={form.category}
          onChange={field("category")}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-shadow"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          rows={3}
          placeholder="What was this expense for?"
          value={form.description}
          onChange={field("description")}
          className={cn(
            "w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-shadow",
            errors.description ? "border-red-400" : "border-gray-200"
          )}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-red-500">{errors.description}</p>
          ) : <span />}
          <span className="text-xs text-gray-400">{form.description.length}/200</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {initial ? "Save Changes" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
