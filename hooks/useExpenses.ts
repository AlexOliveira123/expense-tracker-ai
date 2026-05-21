"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/lib/types";
import { loadExpenses, saveExpenses } from "@/lib/storage";
import { generateId } from "@/lib/utils";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setExpenses(loadExpenses());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveExpenses(expenses);
  }, [expenses, loaded]);

  const addExpense = useCallback(
    (data: Omit<Expense, "id" | "createdAt">) => {
      const expense: Expense = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setExpenses((prev) => [expense, ...prev]);
      return expense;
    },
    []
  );

  const updateExpense = useCallback(
    (id: string, data: Omit<Expense, "id" | "createdAt">) => {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data } : e))
      );
    },
    []
  );

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { expenses, loaded, addExpense, updateExpense, deleteExpense };
}
