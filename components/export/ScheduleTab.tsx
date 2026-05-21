"use client";

import { Clock, Zap, Calendar, Moon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ExportSchedule, ExportHistoryEntry, CLOUD_SERVICE_META, EXPORT_TEMPLATES } from "@/lib/cloudExport";

interface Props {
  schedules: ExportSchedule[];
  onToggle: (id: string) => void;
  activeCount: number;
}

const FREQ_ICONS: Record<string, React.ElementType> = {
  daily: Moon,
  weekly: Calendar,
  monthly: Zap,
};

const FREQ_LABEL: Record<string, string> = {
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
};

const DEST_LABEL: Record<string, string> = {
  "google-drive": "Google Drive",
  "dropbox": "Dropbox",
  "onedrive": "OneDrive",
  "google-sheets": "Google Sheets",
  "email": "Email",
  "local": "Local download",
};

function formatNextRun(iso: string): string {
  const d = parseISO(iso);
  const now = new Date();
  const diffH = Math.round((d.getTime() - now.getTime()) / 3.6e6);
  if (diffH < 24) return `in ${diffH}h`;
  if (diffH < 48) return "tomorrow";
  return format(d, "MMM d");
}

export function ScheduleTab({ schedules, onToggle, activeCount }: Props) {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Automated Exports</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Set-it-and-forget-it recurring exports
          </p>
        </div>
        {activeCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            {activeCount} active
          </span>
        )}
      </div>

      <div className="space-y-3">
        {schedules.map((schedule) => {
          const FreqIcon = FREQ_ICONS[schedule.frequency];
          const template = EXPORT_TEMPLATES.find((t) => t.id === schedule.templateId);

          return (
            <div
              key={schedule.id}
              className={`rounded-2xl border p-4 transition-all ${
                schedule.enabled
                  ? "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    schedule.enabled ? "bg-blue-500" : "bg-gray-100"
                  }`}
                >
                  <FreqIcon size={16} className={schedule.enabled ? "text-white" : "text-gray-400"} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{schedule.name}</p>
                    {/* Toggle switch */}
                    <button
                      onClick={() => onToggle(schedule.id)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors focus:outline-none ${
                        schedule.enabled ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                          schedule.enabled ? "translate-x-4.5 ml-0.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {FREQ_LABEL[schedule.frequency]} at {schedule.time} →{" "}
                    <span className="font-medium">{DEST_LABEL[schedule.destination] ?? schedule.destination}</span>
                  </p>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {template && (
                      <span className="text-[11px] text-gray-400">
                        {template.icon} {template.name}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        schedule.format === "csv"
                          ? "bg-emerald-100 text-emerald-700"
                          : schedule.format === "json"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {schedule.format}
                    </span>
                    {schedule.enabled && (
                      <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                        <Clock size={10} /> Next: {formatNextRun(schedule.nextRun)}
                      </span>
                    )}
                    {schedule.lastRun && (
                      <span className="text-[11px] text-gray-400">
                        Last: {format(parseISO(schedule.lastRun), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <span className="text-xl flex-shrink-0">⚡</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">How scheduling works</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Schedules are simulated in this demo. In production, a background worker
            would run exports server-side and push files to your chosen destination
            without requiring the app to be open.
          </p>
        </div>
      </div>
    </div>
  );
}
