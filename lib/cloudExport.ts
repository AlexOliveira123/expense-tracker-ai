import { format, addDays, addWeeks, addMonths, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Expense, Category } from "./types";
import { CATEGORIES } from "./constants";

// ─── Core types ───────────────────────────────────────────────────────────────

export type CloudService = "google-drive" | "dropbox" | "onedrive" | "google-sheets";
export type ExportFormat = "csv" | "json" | "pdf";
export type ExportDestination = "local" | "email" | CloudService | "link";
export type ScheduleFrequency = "daily" | "weekly" | "monthly";

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  format: ExportFormat;
  dateRange: "current-month" | "current-year" | "last-30-days" | "all-time" | "custom";
  categories: "all" | Category[];
  accent: string; // tailwind bg color class
  recommended?: boolean;
}

export interface CloudConnection {
  service: CloudService;
  connected: boolean;
  accountEmail?: string;
  lastSync?: string;
  storageUsed?: string;
}

export interface ExportSchedule {
  id: string;
  name: string;
  templateId: string;
  frequency: ScheduleFrequency;
  time: string; // HH:MM
  destination: ExportDestination;
  format: ExportFormat;
  enabled: boolean;
  nextRun: string; // ISO
  lastRun?: string; // ISO
}

export interface ExportHistoryEntry {
  id: string;
  timestamp: string; // ISO
  templateName: string;
  format: ExportFormat;
  destination: ExportDestination;
  recordCount: number;
  fileSizeKb: number;
  status: "completed" | "failed" | "processing";
  recipient?: string;
  shareCode?: string;
  serviceName?: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const HISTORY_KEY = "expensify_export_history";
const CONNECTIONS_KEY = "expensify_cloud_connections";
const SCHEDULES_KEY = "expensify_export_schedules";

function ls<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function lsSet(key: string, value: unknown) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

export function loadHistory(): ExportHistoryEntry[] {
  const stored = ls<ExportHistoryEntry[]>(HISTORY_KEY, []);
  if (stored.length > 0) return stored;
  lsSet(HISTORY_KEY, SEED_HISTORY);
  return SEED_HISTORY;
}

export function saveHistory(h: ExportHistoryEntry[]) { lsSet(HISTORY_KEY, h); }

export function loadConnections(): Record<CloudService, CloudConnection> {
  return ls<Record<CloudService, CloudConnection>>(CONNECTIONS_KEY, DEFAULT_CONNECTIONS);
}

export function saveConnections(c: Record<CloudService, CloudConnection>) { lsSet(CONNECTIONS_KEY, c); }

export function loadSchedules(): ExportSchedule[] {
  return ls<ExportSchedule[]>(SCHEDULES_KEY, DEFAULT_SCHEDULES);
}

export function saveSchedules(s: ExportSchedule[]) { lsSet(SCHEDULES_KEY, s); }

export function newHistoryEntry(partial: Omit<ExportHistoryEntry, "id" | "timestamp">): ExportHistoryEntry {
  return { ...partial, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString() };
}

// ─── Export templates ─────────────────────────────────────────────────────────

export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: "monthly-summary",
    name: "Monthly Summary",
    description: "Current month at a glance — great for budget reviews",
    icon: "📊",
    format: "csv",
    dateRange: "current-month",
    categories: "all",
    accent: "bg-blue-500",
    recommended: true,
  },
  {
    id: "tax-report",
    name: "Tax Report",
    description: "Full year, all categories — ready for your accountant",
    icon: "🧾",
    format: "pdf",
    dateRange: "current-year",
    categories: "all",
    accent: "bg-emerald-500",
  },
  {
    id: "category-analysis",
    name: "Category Analysis",
    description: "Structured breakdown by category, all time",
    icon: "📈",
    format: "json",
    dateRange: "all-time",
    categories: "all",
    accent: "bg-purple-500",
  },
  {
    id: "spending-snapshot",
    name: "Spending Snapshot",
    description: "Last 30 days — quick overview of recent activity",
    icon: "💳",
    format: "csv",
    dateRange: "last-30-days",
    categories: "all",
    accent: "bg-amber-500",
  },
  {
    id: "full-backup",
    name: "Full Backup",
    description: "Everything, portable JSON — restore anywhere",
    icon: "💾",
    format: "json",
    dateRange: "all-time",
    categories: "all",
    accent: "bg-slate-600",
  },
  {
    id: "bills-utilities",
    name: "Bills & Utilities",
    description: "Bills category only — track fixed costs over time",
    icon: "⚡",
    format: "csv",
    dateRange: "all-time",
    categories: ["Bills"],
    accent: "bg-red-500",
  },
];

// ─── Apply template date filter ────────────────────────────────────────────────

export function applyTemplateFilter(expenses: Expense[], template: ExportTemplate): Expense[] {
  const now = new Date();
  return expenses.filter((e) => {
    // category filter
    if (template.categories !== "all" && !template.categories.includes(e.category)) return false;
    // date filter
    if (template.dateRange === "current-month") {
      const start = format(startOfMonth(now), "yyyy-MM-dd");
      const end = format(endOfMonth(now), "yyyy-MM-dd");
      return e.date >= start && e.date <= end;
    }
    if (template.dateRange === "current-year") {
      return e.date.startsWith(format(now, "yyyy"));
    }
    if (template.dateRange === "last-30-days") {
      const cutoff = format(subDays(now, 30), "yyyy-MM-dd");
      return e.date >= cutoff;
    }
    return true; // all-time
  });
}

// ─── CSV helper (no external dep) ─────────────────────────────────────────────

export function buildCSV(expenses: Expense[]): string {
  const headers = ["Date", "Category", "Description", "Amount"];
  const rows = expenses.map((e) => [
    e.date, e.category, `"${e.description.replace(/"/g, '""')}"`, e.amount.toFixed(2),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function buildJSON(expenses: Expense[]): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    totalRecords: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map(({ id, createdAt, ...rest }) => rest),
  }, null, 2);
}

export function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Default cloud connections ─────────────────────────────────────────────────

export const CLOUD_SERVICE_META: Record<CloudService, { label: string; color: string; logo: string }> = {
  "google-drive": { label: "Google Drive", color: "text-blue-600", logo: "🔵" },
  "dropbox":      { label: "Dropbox",       color: "text-blue-500", logo: "📦" },
  "onedrive":     { label: "OneDrive",      color: "text-sky-600",  logo: "☁️" },
  "google-sheets":{ label: "Google Sheets", color: "text-green-600",logo: "📗" },
};

const DEFAULT_CONNECTIONS: Record<CloudService, CloudConnection> = {
  "google-drive":  { service: "google-drive",  connected: false },
  "dropbox":       { service: "dropbox",        connected: false },
  "onedrive":      { service: "onedrive",       connected: false },
  "google-sheets": { service: "google-sheets",  connected: false },
};

// ─── Default schedules ────────────────────────────────────────────────────────

const DEFAULT_SCHEDULES: ExportSchedule[] = [
  {
    id: "sched-daily",
    name: "Daily Backup",
    templateId: "full-backup",
    frequency: "daily",
    time: "02:00",
    destination: "google-drive",
    format: "json",
    enabled: false,
    nextRun: addDays(new Date(), 1).toISOString(),
  },
  {
    id: "sched-weekly",
    name: "Weekly Digest",
    templateId: "monthly-summary",
    frequency: "weekly",
    time: "08:00",
    destination: "email",
    format: "csv",
    enabled: false,
    nextRun: addWeeks(new Date(), 1).toISOString(),
  },
  {
    id: "sched-monthly",
    name: "Monthly Report",
    templateId: "tax-report",
    frequency: "monthly",
    time: "00:00",
    destination: "dropbox",
    format: "pdf",
    enabled: false,
    nextRun: addMonths(startOfMonth(new Date()), 1).toISOString(),
  },
];

// ─── Seed history data ────────────────────────────────────────────────────────

const t = (daysAgo: number, hoursAgo = 0) =>
  new Date(Date.now() - daysAgo * 864e5 - hoursAgo * 36e5).toISOString();

export const SEED_HISTORY: ExportHistoryEntry[] = [
  { id: "h1", timestamp: t(0, 2),  templateName: "Monthly Summary",   format: "csv",  destination: "email",        recordCount: 12, fileSizeKb: 2.1,  status: "completed", recipient: "alex@example.com" },
  { id: "h2", timestamp: t(0, 5),  templateName: "Spending Snapshot", format: "csv",  destination: "google-drive", recordCount: 8,  fileSizeKb: 1.4,  status: "completed", serviceName: "Google Drive" },
  { id: "h3", timestamp: t(1),     templateName: "Full Backup",       format: "json", destination: "local",        recordCount: 20, fileSizeKb: 8.7,  status: "completed" },
  { id: "h4", timestamp: t(3),     templateName: "Tax Report",        format: "pdf",  destination: "dropbox",      recordCount: 20, fileSizeKb: 42.3, status: "completed", serviceName: "Dropbox" },
  { id: "h5", timestamp: t(5),     templateName: "Category Analysis", format: "json", destination: "link",         recordCount: 20, fileSizeKb: 6.2,  status: "completed", shareCode: "r8xKp2" },
  { id: "h6", timestamp: t(7),     templateName: "Monthly Summary",   format: "csv",  destination: "email",        recordCount: 15, fileSizeKb: 2.8,  status: "completed", recipient: "alex@example.com" },
  { id: "h7", timestamp: t(9),     templateName: "Tax Report",        format: "pdf",  destination: "email",        recordCount: 18, fileSizeKb: 0,    status: "failed",    recipient: "accountant@firm.com" },
  { id: "h8", timestamp: t(14),    templateName: "Full Backup",       format: "json", destination: "google-drive", recordCount: 16, fileSizeKb: 7.1,  status: "completed", serviceName: "Google Drive" },
];
