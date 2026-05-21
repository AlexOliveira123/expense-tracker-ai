"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, RotateCcw, Trash2, Clock } from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ExportHistoryEntry, ExportDestination } from "@/lib/cloudExport";

interface Props {
  history: ExportHistoryEntry[];
  onClear: () => void;
}

const DEST_ICON: Record<ExportDestination, string> = {
  "local": "💾",
  "email": "✉️",
  "google-drive": "🔵",
  "dropbox": "📦",
  "onedrive": "☁️",
  "google-sheets": "📗",
  "link": "🔗",
};

const FORMAT_COLORS: Record<string, string> = {
  csv: "bg-emerald-100 text-emerald-700",
  json: "bg-blue-100 text-blue-700",
  pdf: "bg-red-100 text-red-700",
};

function humanDestination(entry: ExportHistoryEntry): string {
  if (entry.destination === "email") return entry.recipient ?? "Email";
  if (entry.destination === "link") return `expensify.demo/r/${entry.shareCode}`;
  if (entry.serviceName) return entry.serviceName;
  return entry.destination;
}

function groupLabel(timestamp: string): string {
  const d = parseISO(timestamp);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

export function HistoryTab({ history, onClear }: Props) {
  const [filter, setFilter] = useState<"all" | "completed" | "failed">("all");

  const filtered = history.filter((e) => filter === "all" || e.status === filter);

  // Group by day
  const groups: { label: string; entries: ExportHistoryEntry[] }[] = [];
  for (const entry of filtered) {
    const label = groupLabel(entry.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.entries.push(entry);
    else groups.push({ label, entries: [entry] });
  }

  const successCount = history.filter((e) => e.status === "completed").length;
  const failCount = history.filter((e) => e.status === "failed").length;

  return (
    <div className="p-5 space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total exports", value: history.length, color: "text-gray-900" },
          { label: "Successful", value: successCount, color: "text-emerald-600" },
          { label: "Failed", value: failCount, color: failCount > 0 ? "text-red-500" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-2xl p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["all", "completed", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} /> Clear history
          </button>
        )}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 font-medium">No exports yet</p>
          <p className="text-xs text-gray-300 mt-1">Run a template or send a report to see history</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow"
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {entry.status === "completed" && (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      )}
                      {entry.status === "failed" && (
                        <XCircle size={18} className="text-red-400" />
                      )}
                      {entry.status === "processing" && (
                        <Loader2 size={18} className="text-blue-400 animate-spin" />
                      )}
                    </div>

                    {/* Destination icon */}
                    <span className="text-xl flex-shrink-0">{DEST_ICON[entry.destination]}</span>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{entry.templateName}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${FORMAT_COLORS[entry.format]}`}>
                          {entry.format}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {humanDestination(entry)}
                        {entry.status === "completed" && (
                          <> · {entry.recordCount} records{entry.fileSizeKb > 0 ? ` · ${entry.fileSizeKb} KB` : ""}</>
                        )}
                        {entry.status === "failed" && (
                          <span className="text-red-400"> · Failed — connection error</span>
                        )}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {format(parseISO(entry.timestamp), "h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
