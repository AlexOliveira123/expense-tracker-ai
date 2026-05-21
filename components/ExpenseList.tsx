"use client";

import { useState } from "react";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { Expense } from "@/lib/types";
import { CategoryBadge } from "./ui/Badge";
import { Modal } from "./ui/Modal";
import { ExpenseForm } from "./ExpenseForm";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  expenses: Expense[];
  onUpdate: (id: string, data: Omit<Expense, "id" | "createdAt">) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onUpdate, onDelete }: Props) {
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Receipt size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">No expenses found</p>
        <p className="text-gray-400 text-sm mt-1">Add your first expense or adjust your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-gray-900 truncate">{expense.description}</p>
                <CategoryBadge category={expense.category} />
              </div>
              <p className="text-sm text-gray-400">{formatDate(expense.date)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-900 tabular-nums">
                {formatCurrency(expense.amount)}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditTarget(expense)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteTarget(expense)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Expense">
        {editTarget && (
          <ExpenseForm
            initial={editTarget}
            onSubmit={(data) => { onUpdate(editTarget.id, data); setEditTarget(null); }}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Expense">
        {deleteTarget && (
          <div>
            <p className="text-gray-600 mb-1">
              Are you sure you want to delete this expense?
            </p>
            <p className="font-medium text-gray-900 mb-6">
              {deleteTarget.description} — {formatCurrency(deleteTarget.amount)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
