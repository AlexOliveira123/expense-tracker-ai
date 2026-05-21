"use client";

import { useState, useEffect, useCallback } from "react";
import { X, LayoutTemplate, Send, Clock2, History, Wifi } from "lucide-react";
import { Expense } from "@/lib/types";
import {
  CloudService,
  CloudConnection,
  ExportSchedule,
  ExportHistoryEntry,
  loadHistory,
  saveHistory,
  loadConnections,
  saveConnections,
  loadSchedules,
  saveSchedules,
  newHistoryEntry,
} from "@/lib/cloudExport";
import { TemplatesTab } from "./export/TemplatesTab";
import { SendShareTab } from "./export/SendShareTab";
import { ScheduleTab } from "./export/ScheduleTab";
import { HistoryTab } from "./export/HistoryTab";

// ─── Tab definition ────────────────────────────────────────────────────────────

type Tab = "templates" | "send" | "schedule" | "history";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "templates", label: "Templates",  icon: LayoutTemplate },
  { id: "send",      label: "Send & Share", icon: Send },
  { id: "schedule",  label: "Schedule",   icon: Clock2 },
  { id: "history",   label: "History",    icon: History },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExportDrawer({ isOpen, onClose, expenses }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("templates");

  // Shared persisted state
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [connections, setConnections] = useState<Record<CloudService, CloudConnection>>({
    "google-drive":  { service: "google-drive",  connected: false },
    "dropbox":       { service: "dropbox",        connected: false },
    "onedrive":      { service: "onedrive",       connected: false },
    "google-sheets": { service: "google-sheets",  connected: false },
  });
  const [schedules, setSchedules] = useState<ExportSchedule[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
    setConnections(loadConnections());
    setSchedules(loadSchedules());
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // ── History handlers ─────────────────────────────────────────
  const addToHistory = useCallback((entry: ExportHistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev];
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  // ── Connection handler ───────────────────────────────────────
  const handleConnectionChange = useCallback(
    (service: CloudService, conn: CloudConnection) => {
      setConnections((prev) => {
        const next = { ...prev, [service]: conn };
        saveConnections(next);
        return next;
      });
    },
    []
  );

  // ── Schedule handler ─────────────────────────────────────────
  const toggleSchedule = useCallback((id: string) => {
    setSchedules((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
      saveSchedules(next);
      return next;
    });
  }, []);

  const connectedCount = Object.values(connections).filter((c) => c.connected).length;
  const activeScheduleCount = schedules.filter((s) => s.enabled).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-[640px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Drawer header ──────────────────────────────────── */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 pt-5 pb-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Sync & Export</h2>
                {connectedCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Wifi size={9} /> {connectedCount} connected
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {expenses.length} records · {activeScheduleCount > 0 && `${activeScheduleCount} schedule${activeScheduleCount > 1 ? "s" : ""} active · `}
                {history.length} export{history.length !== 1 ? "s" : ""} in history
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab bar — sits flush with header bottom */}
          <div className="flex gap-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-t-xl transition-colors ${
                  activeTab === id
                    ? "bg-white text-gray-900"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/10"
                }`}
              >
                <Icon size={13} />
                {label}
                {id === "history" && history.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 rounded-full ${activeTab === "history" ? "bg-blue-100 text-blue-700" : "bg-gray-600 text-gray-300"}`}>
                    {history.length}
                  </span>
                )}
                {id === "schedule" && activeScheduleCount > 0 && (
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content (scrollable) ───────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "templates" && (
            <TemplatesTab expenses={expenses} onHistoryAdd={addToHistory} />
          )}
          {activeTab === "send" && (
            <SendShareTab
              expenses={expenses}
              connections={connections}
              onConnectionChange={handleConnectionChange}
              onHistoryAdd={addToHistory}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab
              schedules={schedules}
              onToggle={toggleSchedule}
              activeCount={activeScheduleCount}
            />
          )}
          {activeTab === "history" && (
            <HistoryTab history={history} onClear={clearHistory} />
          )}
        </div>
      </div>
    </>
  );
}
