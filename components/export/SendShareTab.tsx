"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send, Link2, Copy, Check, RefreshCw, Loader2,
  Plug, PlugZap, CloudOff, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Expense } from "@/lib/types";
import {
  CloudService,
  CloudConnection,
  ExportHistoryEntry,
  CLOUD_SERVICE_META,
  buildCSV,
  buildJSON,
  triggerDownload,
  newHistoryEntry,
} from "@/lib/cloudExport";
import { formatCurrency } from "@/lib/utils";

interface Props {
  expenses: Expense[];
  connections: Record<CloudService, CloudConnection>;
  onConnectionChange: (service: CloudService, conn: CloudConnection) => void;
  onHistoryAdd: (entry: ExportHistoryEntry) => void;
}

const SERVICES: CloudService[] = ["google-drive", "dropbox", "onedrive", "google-sheets"];

const FAKE_ACCOUNTS: Record<CloudService, string> = {
  "google-drive": "alex@gmail.com",
  "dropbox": "alex.dropbox.com",
  "onedrive": "alex@outlook.com",
  "google-sheets": "alex@gmail.com",
};

const FAKE_STORAGE: Record<CloudService, string> = {
  "google-drive": "2.3 GB used of 15 GB",
  "dropbox": "4.1 GB used of 2 TB",
  "onedrive": "12.8 GB used of 100 GB",
  "google-sheets": "Linked to 3 sheets",
};

function randomShareCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function SendShareTab({ expenses, connections, onConnectionChange, onHistoryAdd }: Props) {
  // ── Email section ────────────────────────────────────────────
  const [emailTo, setEmailTo] = useState("");
  const [emailFormat, setEmailFormat] = useState<"csv" | "json">("csv");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function sendEmail() {
    if (!emailTo.includes("@")) return;
    setEmailStatus("sending");
    await new Promise((r) => setTimeout(r, 2000));
    onHistoryAdd(newHistoryEntry({
      templateName: "Manual Export",
      format: emailFormat,
      destination: "email",
      recordCount: expenses.length,
      fileSizeKb: Math.round(expenses.length * 0.12 * 10) / 10,
      status: "completed",
      recipient: emailTo,
    }));
    setEmailStatus("sent");
    setTimeout(() => { setEmailStatus("idle"); }, 3000);
  }

  // ── Cloud services ───────────────────────────────────────────
  const [connecting, setConnecting] = useState<CloudService | null>(null);
  const [syncing, setSyncing] = useState<CloudService | null>(null);

  async function toggleConnect(service: CloudService) {
    const conn = connections[service];
    if (conn.connected) {
      onConnectionChange(service, { ...conn, connected: false, accountEmail: undefined, lastSync: undefined });
      return;
    }
    setConnecting(service);
    await new Promise((r) => setTimeout(r, 1800));
    setConnecting(null);
    onConnectionChange(service, {
      service,
      connected: true,
      accountEmail: FAKE_ACCOUNTS[service],
      lastSync: new Date().toISOString(),
      storageUsed: FAKE_STORAGE[service],
    });
  }

  async function syncNow(service: CloudService) {
    setSyncing(service);
    await new Promise((r) => setTimeout(r, 1500));
    onConnectionChange(service, { ...connections[service], lastSync: new Date().toISOString() });
    onHistoryAdd(newHistoryEntry({
      templateName: "Cloud Sync",
      format: "json",
      destination: service,
      recordCount: expenses.length,
      fileSizeKb: Math.round(expenses.length * 0.43 * 10) / 10,
      status: "completed",
      serviceName: CLOUD_SERVICE_META[service].label,
    }));
    setSyncing(null);
  }

  // ── Shareable link + QR ──────────────────────────────────────
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);

  const shareUrl = shareCode ? `expensify.demo/r/${shareCode}` : null;
  const fullShareUrl = shareCode ? `https://expensify.demo/r/${shareCode}` : null;

  const generateLink = useCallback(async () => {
    const code = randomShareCode();
    setShareCode(code);
    setGeneratingQr(true);
    const url = `https://expensify.demo/r/${code}`;
    try {
      const { default: QRCode } = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(url, {
        width: 160,
        margin: 2,
        color: { dark: "#1e3a8a", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      onHistoryAdd(newHistoryEntry({
        templateName: "Shared Link",
        format: "csv",
        destination: "link",
        recordCount: expenses.length,
        fileSizeKb: 0,
        status: "completed",
        shareCode: code,
      }));
    } finally {
      setGeneratingQr(false);
    }
  }, [expenses, onHistoryAdd]);

  async function copyLink() {
    if (!fullShareUrl) return;
    await navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-5 space-y-6">
      {/* ── Email ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Send size={15} className="text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Send via Email</h3>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="recipient@email.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={emailFormat}
              onChange={(e) => setEmailFormat(e.target.value as "csv" | "json")}
              className="px-3 py-2 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {expenses.length} records · {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))} total
            </p>
            <button
              onClick={sendEmail}
              disabled={!emailTo.includes("@") || emailStatus !== "idle"}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                emailStatus === "sent"
                  ? "bg-emerald-500 text-white"
                  : emailStatus === "sending"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
              }`}
            >
              {emailStatus === "sending" && <Loader2 size={12} className="animate-spin" />}
              {emailStatus === "sent" && <CheckCircle2 size={12} />}
              {emailStatus === "sent" ? "Sent!" : emailStatus === "sending" ? "Sending…" : "Send Report"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Cloud destinations ────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <PlugZap size={15} className="text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Cloud Destinations</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map((service) => {
            const conn = connections[service];
            const meta = CLOUD_SERVICE_META[service];
            const isConnecting = connecting === service;
            const isSyncing = syncing === service;

            return (
              <div
                key={service}
                className={`rounded-2xl border p-3.5 transition-all ${
                  conn.connected
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.logo}</span>
                    <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
                  </div>
                  {conn.connected && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      LIVE
                    </span>
                  )}
                </div>

                {conn.connected ? (
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-gray-600 font-medium">{conn.accountEmail}</p>
                    <p className="text-[11px] text-gray-400">{conn.storageUsed}</p>
                    {conn.lastSync && (
                      <p className="text-[11px] text-gray-400">
                        Synced {new Date(conn.lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">Not connected</p>
                )}

                <div className="flex gap-1.5">
                  {conn.connected && (
                    <button
                      onClick={() => syncNow(service)}
                      disabled={isSyncing}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50"
                    >
                      {isSyncing
                        ? <Loader2 size={11} className="animate-spin" />
                        : <RefreshCw size={11} />}
                      {isSyncing ? "Syncing…" : "Sync Now"}
                    </button>
                  )}
                  <button
                    onClick={() => toggleConnect(service)}
                    disabled={isConnecting}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      conn.connected
                        ? "bg-white border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                        : "bg-gray-900 text-white hover:bg-gray-700"
                    }`}
                  >
                    {isConnecting ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : conn.connected ? (
                      <CloudOff size={11} />
                    ) : (
                      <Plug size={11} />
                    )}
                    {isConnecting ? "Connecting…" : conn.connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Shareable link + QR ───────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Link2 size={15} className="text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Shareable Link</h3>
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            SIMULATED
          </span>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          {!shareCode ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">
                Generate a read-only link anyone can open in their browser
              </p>
              <button
                onClick={generateLink}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                Generate Link & QR Code
              </button>
            </div>
          ) : (
            <div className="flex gap-4 items-start">
              {/* QR code */}
              <div className="flex-shrink-0">
                {generatingQr ? (
                  <div className="w-[100px] h-[100px] bg-gray-100 rounded-xl flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR code" className="w-[100px] h-[100px] rounded-xl border border-gray-200" />
                ) : null}
              </div>

              {/* Link + actions */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-600 truncate flex-1 font-mono">{shareUrl}</span>
                  <button
                    onClick={copyLink}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Expires in 7 days · {expenses.length} records · read-only
                </p>
                <button
                  onClick={generateLink}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
