"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FileText,
  FileJson,
  FileImage,
  Download,
  CheckCircle2,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Expense, Category } from "@/lib/types";
import { CATEGORIES, CATEGORY_BG, CATEGORY_COLORS } from "@/lib/constants";
import { filterExpenses, formatCurrency, formatDate } from "@/lib/utils";
import { exportCSV, exportJSON, exportPDF } from "@/lib/exporters";
import { Modal } from "@/components/ui/Modal";
import { CategoryBadge } from "@/components/ui/Badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportFormat = "csv" | "json" | "pdf";
type ExportStatus = "idle" | "exporting" | "done" | "error";

interface ExportConfig {
  format: ExportFormat;
  dateFrom: string;
  dateTo: string;
  selectedCategories: Set<Category>;
  filename: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allExpenses: Expense[];
}

// ─── Format option cards ───────────────────────────────────────────────────────

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  ext: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: "csv",
    label: "CSV",
    ext: ".csv",
    description: "Spreadsheet-compatible",
    icon: FileText,
    color: "text-emerald-600",
  },
  {
    id: "json",
    label: "JSON",
    ext: ".json",
    description: "Structured data",
    icon: FileJson,
    color: "text-blue-600",
  },
  {
    id: "pdf",
    label: "PDF",
    ext: ".pdf",
    description: "Print-ready report",
    icon: FileImage,
    color: "text-red-500",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaultFilename(config: Omit<ExportConfig, "filename">): string {
  const today = format(new Date(), "yyyy-MM-dd");
  if (config.dateFrom && config.dateTo) {
    return `expenses-${config.dateFrom}-to-${config.dateTo}`;
  }
  if (config.dateFrom) return `expenses-from-${config.dateFrom}`;
  if (config.dateTo) return `expenses-to-${config.dateTo}`;
  return `expenses-${today}`;
}

const PREVIEW_ROWS = 8;

// ─── Component ────────────────────────────────────────────────────────────────

export function ExportModal({ isOpen, onClose, allExpenses }: Props) {
  const [format_, setFormat] = useState<ExportFormat>("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    new Set(CATEGORIES)
  );
  const [filenameOverride, setFilenameOverride] = useState("");
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Derived filtered list
  const filtered = useMemo(() => {
    return allExpenses.filter((e) => {
      if (!selectedCategories.has(e.category)) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      return true;
    });
  }, [allExpenses, selectedCategories, dateFrom, dateTo]);

  const defaultFilename = useMemo(
    () => buildDefaultFilename({ format: format_, dateFrom, dateTo, selectedCategories }),
    [format_, dateFrom, dateTo, selectedCategories]
  );

  const filename = filenameOverride.trim() || defaultFilename;
  const totalAmount = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered]
  );

  // Category toggle helpers
  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }, []);

  const allSelected = selectedCategories.size === CATEGORIES.length;
  const toggleAll = useCallback(() => {
    setSelectedCategories(allSelected ? new Set() : new Set(CATEGORIES));
  }, [allSelected]);

  // Export handler
  const handleExport = useCallback(async () => {
    if (filtered.length === 0) return;
    setStatus("exporting");
    setErrorMsg("");
    try {
      // Small artificial delay so the loading state is perceptible
      await new Promise((r) => setTimeout(r, 600));
      if (format_ === "csv") await exportCSV(filtered, filename);
      else if (format_ === "json") await exportJSON(filtered, filename);
      else await exportPDF(filtered, filename);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Export failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [filtered, filename, format_]);

  const handleClose = useCallback(() => {
    if (status === "exporting") return;
    onClose();
    setTimeout(() => {
      setFormat("csv");
      setDateFrom("");
      setDateTo("");
      setSelectedCategories(new Set(CATEGORIES));
      setFilenameOverride("");
      setStatus("idle");
    }, 200);
  }, [status, onClose]);

  const previewRows = filtered.slice(0, PREVIEW_ROWS);
  const hiddenCount = filtered.length - PREVIEW_ROWS;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Export Data" size="xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left column: config ─────────────────────────────────── */}
        <div className="lg:w-72 flex-shrink-0 space-y-5">
          {/* Format selector */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Format
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                    format_ === opt.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <opt.icon
                    size={22}
                    className={format_ === opt.id ? opt.color : "text-gray-400"}
                  />
                  <span
                    className={`text-xs font-bold ${
                      format_ === opt.id ? "text-blue-700" : "text-gray-500"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-400 leading-tight">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Date Range
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Clear dates
                </button>
              )}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Categories
              </p>
              <button
                onClick={toggleAll}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {allSelected ? (
                  <><ToggleRight size={14} /> Deselect all</>
                ) : (
                  <><ToggleLeft size={14} /> Select all</>
                )}
              </button>
            </div>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => {
                const checked = selectedCategories.has(cat);
                return (
                  <label
                    key={cat}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    <span
                      className={`text-sm transition-colors ${
                        checked ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {cat}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Filename */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Filename
            </p>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="text"
                placeholder={defaultFilename}
                value={filenameOverride}
                onChange={(e) => setFilenameOverride(e.target.value)}
                className="flex-1 px-3 py-2 text-sm focus:outline-none min-w-0"
              />
              <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-l border-gray-200 flex-shrink-0">
                .{format_}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Leave blank to use auto-generated name
            </p>
          </div>
        </div>

        {/* ── Right column: preview ────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Summary strip */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold tabular-nums">
                  {filtered.length}
                </p>
                <p className="text-blue-200 text-sm">
                  record{filtered.length !== 1 ? "s" : ""} to export
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(totalAmount)}
                </p>
                <p className="text-blue-200 text-sm">total amount</p>
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <p className="text-blue-200 text-xs mt-2 border-t border-blue-500 pt-2">
                {dateFrom && dateTo
                  ? `${formatDate(dateFrom)} → ${formatDate(dateTo)}`
                  : dateFrom
                  ? `From ${formatDate(dateFrom)}`
                  : `Until ${formatDate(dateTo)}`}
              </p>
            )}
          </div>

          {/* Preview table */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Preview
            </p>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                <p className="font-medium text-sm">No records match your filters</p>
                <p className="text-xs mt-1">Adjust the date range or categories</p>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Category</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Description</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {previewRows.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                          {formatDate(e.date)}
                        </td>
                        <td className="px-4 py-2.5">
                          <CategoryBadge category={e.category} />
                        </td>
                        <td className="px-4 py-2.5 text-gray-700 truncate max-w-[180px]">
                          {e.description}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
                          {formatCurrency(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hiddenCount > 0 && (
                  <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
                    ... and {hiddenCount} more record{hiddenCount !== 1 ? "s" : ""} not shown
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          {status === "done" && (
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> Export complete!
            </span>
          )}
          {status === "error" && (
            <span className="text-red-500 text-sm">{errorMsg || "Export failed. Try again."}</span>
          )}
          {status === "idle" && filtered.length > 0 && (
            <span>
              Exporting as <span className="font-medium text-gray-700">{filename}.{format_}</span>
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={status === "exporting"}
            className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0 || status === "exporting"}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[160px] justify-center"
          >
            {status === "exporting" ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download size={15} />
                Export {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
