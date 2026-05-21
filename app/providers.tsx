"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { Navigation } from "@/components/Navigation";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Expense } from "@/lib/types";

interface ExpenseCtx {
  expenses: Expense[];
  loaded: boolean;
  addExpense: (data: Omit<Expense, "id" | "createdAt">) => Expense;
  updateExpense: (id: string, data: Omit<Expense, "id" | "createdAt">) => void;
  deleteExpense: (id: string) => void;
  openAddModal: () => void;
}

const Ctx = createContext<ExpenseCtx | null>(null);

export function useExpenseContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExpenseContext must be inside Providers");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { expenses, loaded, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [addOpen, setAddOpen] = useState(false);

  const openAddModal = useCallback(() => setAddOpen(true), []);

  return (
    <Ctx.Provider value={{ expenses, loaded, addExpense, updateExpense, deleteExpense, openAddModal }}>
      <Navigation onAddClick={openAddModal} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Expense">
        <ExpenseForm
          onSubmit={(data) => { addExpense(data); setAddOpen(false); }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </Ctx.Provider>
  );
}
