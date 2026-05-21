import { format } from "date-fns";
import { Expense } from "./types";
import { formatCurrency } from "./utils";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportCSV(expenses: Expense[], filename: string): Promise<void> {
  const headers = ["Date", "Category", "Description", "Amount"];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

export async function exportJSON(expenses: Expense[], filename: string): Promise<void> {
  const data = {
    exportedAt: new Date().toISOString(),
    totalRecords: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map(({ id, createdAt, ...rest }) => rest),
  };
  const json = JSON.stringify(data, null, 2);
  triggerDownload(new Blob([json], { type: "application/json" }), `${filename}.json`);
}

export async function exportPDF(expenses: Expense[], filename: string): Promise<void> {
  // Dynamic import keeps jsPDF out of the initial bundle
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const generatedOn = format(new Date(), "MMMM d, yyyy 'at' h:mm a");

  // Header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Expense Report", 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${generatedOn}`, 14, 20);

  // Summary strip
  doc.setFillColor(239, 246, 255);
  doc.rect(0, 28, 210, 18, "F");
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${expenses.length} record${expenses.length !== 1 ? "s" : ""}`, 14, 38);
  doc.setFont("helvetica", "normal");
  doc.text(`Total: ${formatCurrency(total)}`, 80, 38);

  // Table
  autoTable(doc, {
    startY: 52,
    head: [["Date", "Category", "Description", "Amount"]],
    body: expenses.map((e) => [
      format(new Date(e.date + "T00:00:00"), "MMM d, yyyy"),
      e.category,
      e.description,
      formatCurrency(e.amount),
    ]),
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [31, 41, 55] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
    foot: [["", "", "Total", formatCurrency(total)]],
    footStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    margin: { left: 14, right: 14 },
  });

  // Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: "right" });
    doc.text("Expensify", 14, 287);
  }

  doc.save(`${filename}.pdf`);
}
