"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Expense } from "@/lib/types";
import {
  EXPORT_TEMPLATES,
  ExportTemplate,
  ExportHistoryEntry,
  applyTemplateFilter,
  buildCSV,
  buildJSON,
  triggerDownload,
  newHistoryEntry,
} from "@/lib/cloudExport";
import { formatCurrency } from "@/lib/utils";

interface Props {
  expenses: Expense[];
  onHistoryAdd: (entry: ExportHistoryEntry) => void;
}

const FORMAT_PILL: Record<string, string> = {
  csv: "bg-emerald-100 text-emerald-700",
  json: "bg-blue-100 text-blue-700",
  pdf: "bg-red-100 text-red-700",
};

const DATE_RANGE_LABEL: Record<string, string> = {
  "current-month": "This month",
  "current-year": "This year",
  "last-30-days": "Last 30 days",
  "all-time": "All time",
};

export function TemplatesTab({ expenses, onHistoryAdd }: Props) {
  const [running, setRunning] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function runTemplate(template: ExportTemplate) {
    setRunning(template.id);
    await new Promise((r) => setTimeout(r, 900));

    const subset = applyTemplateFilter(expenses, template);
    const filename = `${template.id}-${new Date().toISOString().slice(0, 10)}`;

    if (template.format === "csv") {
      triggerDownload(buildCSV(subset), `${filename}.csv`, "text/csv;charset=utf-8;");
    } else if (template.format === "json") {
      triggerDownload(buildJSON(subset), `${filename}.json`, "application/json");
    } else {
      // PDF: use jspdf dynamically (same approach as v2 for reuse)
      try {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(template.name, 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated ${new Date().toLocaleDateString()} · ${subset.length} records`, 14, 28);
        autoTable(doc, {
          startY: 36,
          head: [["Date", "Category", "Description", "Amount"]],
          body: subset.map((e) => [e.date, e.category, e.description, `$${e.amount.toFixed(2)}`]),
          headStyles: { fillColor: [37, 99, 235] },
        });
        doc.save(`${filename}.pdf`);
      } catch {
        // jspdf not installed on this branch — fall back to CSV
        triggerDownload(buildCSV(subset), `${filename}.csv`, "text/csv;charset=utf-8;");
      }
    }

    onHistoryAdd(
      newHistoryEntry({
        templateName: template.name,
        format: template.format,
        destination: "local",
        recordCount: subset.length,
        fileSizeKb: Math.round((subset.length * 120) / 1024 * 10) / 10,
        status: "completed",
      })
    );

    setRunning(null);
    setDone(template.id);
    setTimeout(() => setDone(null), 2000);
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Export Templates</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            One-click exports pre-configured for common use cases
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          <Sparkles size={12} /> {expenses.length} records ready
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EXPORT_TEMPLATES.map((t) => {
          const subset = applyTemplateFilter(expenses, t);
          const isRunning = running === t.id;
          const isDone = done === t.id;

          return (
            <div
              key={t.id}
              className="relative bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all group overflow-hidden"
            >
              {/* Recommended ribbon */}
              {t.recommended && (
                <div className="absolute top-0 right-0 text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-bl-xl rounded-tr-2xl">
                  RECOMMENDED
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 ${t.accent} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${FORMAT_PILL[t.format]}`}>
                      {t.format}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>{DATE_RANGE_LABEL[t.dateRange]}</span>
                    <span>·</span>
                    <span>{subset.length} records</span>
                    {subset.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{formatCurrency(subset.reduce((s, e) => s + e.amount, 0))}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => runTemplate(t)}
                disabled={isRunning || subset.length === 0}
                className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isRunning
                    ? "bg-blue-100 text-blue-600 cursor-wait"
                    : subset.length === 0
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {isDone ? (
                  <><CheckCircle2 size={13} /> Exported!</>
                ) : isRunning ? (
                  <><Loader2 size={13} className="animate-spin" /> Exporting…</>
                ) : (
                  <>Export {t.format.toUpperCase()}</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
