export type ReportPdfData = {
  clinicName: string;
  currencyLabel: (n: number) => string;
  stats: { label: string; value: string }[];
  months: { month: string; revenue: number; visits: number }[];
  serviceMix: { name: string; value: number }[];
  paidInvoices: { number: string; issued: string; total: number }[];
};

/** Builds and downloads a PDF of the reports page. Browser-only. */
export async function downloadReportPdf(data: ReportPdfData) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const brand: [number, number, number] = [16, 122, 96];
  const muted: [number, number, number] = [110, 120, 118];

  // Header band
  doc.setFillColor(...brand);
  doc.rect(0, 0, pageWidth, 76, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Vetigo — Clinic report", margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `${data.clinicName} · six-month snapshot · generated ${new Date().toLocaleDateString()}`,
    margin,
    54,
  );

  let y = 108;
  doc.setTextColor(30, 35, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Summary", margin, y);
  y += 12;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: data.stats.map((s) => [s.label, s.value]),
    theme: "grid",
    margin: { left: margin, right: margin },
    headStyles: { fillColor: brand, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 6 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Revenue & visits by month", margin, y);

  autoTable(doc, {
    startY: y + 12,
    head: [["Month", "Revenue", "Appointments"]],
    body: data.months.map((m) => [
      m.month,
      data.currencyLabel(m.revenue),
      String(m.visits),
    ]),
    theme: "striped",
    margin: { left: margin, right: margin },
    headStyles: { fillColor: brand, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 6 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Top services", margin, y);

  autoTable(doc, {
    startY: y + 12,
    head: [["Service", "Appointments"]],
    body: data.serviceMix.length
      ? data.serviceMix.map((s) => [s.name, String(s.value)])
      : [["No service data yet", "—"]],
    theme: "striped",
    margin: { left: margin, right: margin },
    headStyles: { fillColor: brand, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 6 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recent paid invoices", margin, y);

  autoTable(doc, {
    startY: y + 12,
    head: [["Invoice", "Issued", "Total"]],
    body: data.paidInvoices.length
      ? data.paidInvoices.map((i) => [i.number, i.issued, data.currencyLabel(i.total)])
      : [["No paid invoices yet", "—", "—"]],
    theme: "grid",
    margin: { left: margin, right: margin },
    headStyles: { fillColor: brand, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 6 },
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(
      `Vetigo · ${data.clinicName} · page ${p} of ${pages}`,
      margin,
      doc.internal.pageSize.getHeight() - 24,
    );
  }

  const slug = data.clinicName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  doc.save(`vetigo-report-${slug || "clinic"}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
