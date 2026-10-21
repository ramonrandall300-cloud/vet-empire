import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { useClinic } from "@/lib/clinic-context";
import { useClinicRows } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — Vetigo" },
      { name: "description", content: "Revenue, visit volume and service mix for your clinic." },
      { property: "og:title", content: "Reports & Analytics — Vetigo" },
      { property: "og:description", content: "Revenue, visit volume and service mix for your clinic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Reports />
    </RequireClinic>
  ),
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Reports() {
  const { clinic } = useClinic();
  const [exporting, setExporting] = useState(false);
  const invoices = useClinicRows("invoices", { orderBy: "issued_at" });
  const appointments = useClinicRows("appointments", {
    select: "id, starts_at, status, services(name)",
    orderBy: "starts_at",
  });

  const money = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: clinic?.currency ?? "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const months = useMemo(() => {
    const base = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
    return base.map((m) => {
      const key = format(m, "yyyy-MM");
      const revenue = (invoices.data ?? [])
        .filter((r) => r["status"] === "paid" && String(r["issued_at"]).slice(0, 7) === key)
        .reduce((s, r) => s + Number(r["total"]), 0);
      const visits = (appointments.data ?? []).filter(
        (a) => String(a["starts_at"]).slice(0, 7) === key,
      ).length;
      return { month: format(m, "MMM"), revenue, visits };
    });
  }, [invoices.data, appointments.data]);

  const serviceMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of appointments.data ?? []) {
      const name = (a["services"] as { name?: string } | null)?.name ?? "Other";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, value]) => ({ name, value })).slice(0, 5);
  }, [appointments.data]);

  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalVisits = months.reduce((s, m) => s + m.visits, 0);
  const completed = (appointments.data ?? []).filter((a) => a["status"] === "completed").length;
  const avgInvoice = (invoices.data ?? []).length
    ? (invoices.data ?? []).reduce((s, r) => s + Number(r["total"]), 0) /
      (invoices.data ?? []).length
    : 0;

  async function exportPdf() {
    setExporting(true);
    try {
      const { downloadReportPdf } = await import("@/lib/report-pdf");
      await downloadReportPdf({
        clinicName: clinic?.name ?? "Clinic",
        currencyLabel: money,
        stats: [
          { label: "Revenue (6 mo)", value: money(totalRevenue) },
          { label: "Appointments (6 mo)", value: String(totalVisits) },
          { label: "Completed visits", value: String(completed) },
          { label: "Avg. invoice", value: money(avgInvoice) },
        ],
        months,
        serviceMix,
        paidInvoices: (invoices.data ?? [])
          .filter((r) => r["status"] === "paid")
          .slice(0, 20)
          .map((r) => ({
            number: String(r["number"]),
            issued: format(parseISO(String(r["issued_at"])), "d MMM yyyy"),
            total: Number(r["total"]),
          })),
      });
      toast.success("Report downloaded");
    } catch {
      toast.error("Could not generate the PDF");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Six-month performance snapshot for this clinic."
        actions={
          <Button onClick={exportPdf} disabled={exporting}>
            <Download className="mr-2 size-4" />
            {exporting ? "Preparing…" : "Download PDF"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (6 mo)" value={money(totalRevenue)} />
        <StatCard label="Appointments (6 mo)" value={totalVisits} />
        <StatCard label="Completed visits" value={completed} />
        <StatCard
          label="Avg. invoice"
          value={money(avgInvoice)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="surface-panel p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Revenue & visits by month</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="visits" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-panel p-5">
          <h2 className="mb-4 text-base font-semibold">Top services</h2>
          {serviceMix.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceMix}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                  >
                    {serviceMix.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Book appointments with services to see the mix here.
            </p>
          )}
        </section>
      </div>

      <section className="surface-panel mt-6 p-5">
        <h2 className="mb-4 text-base font-semibold">Recent paid invoices</h2>
        <ul className="divide-y">
          {(invoices.data ?? [])
            .filter((r) => r["status"] === "paid")
            .slice(0, 6)
            .map((r) => (
              <li key={String(r["id"])} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium">{String(r["number"])}</span>
                <span className="text-muted-foreground">
                  {format(parseISO(String(r["issued_at"])), "d MMM yyyy")}
                </span>
                <span className="font-semibold">{money(Number(r["total"]))}</span>
              </li>
            ))}
          {!(invoices.data ?? []).some((r) => r["status"] === "paid") && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No paid invoices yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
