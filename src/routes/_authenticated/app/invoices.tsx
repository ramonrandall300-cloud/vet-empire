import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { PageHeader, StatCard } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { ResourceTable } from "@/components/resource-table";
import { Badge } from "@/components/ui/badge";
import { useClinic } from "@/lib/clinic-context";
import { useClinicRows, useLookup } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — Vetigo" },
      { name: "description", content: "Bill customers, track payments and outstanding balances." },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Invoices />
    </RequireClinic>
  ),
});

const tone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sent: "secondary",
  paid: "default",
  overdue: "destructive",
  void: "outline",
};

function Invoices() {
  const { clinic } = useClinic();
  const customers = useLookup("customers", "full_name");
  const pets = useLookup("pets");
  const { data } = useClinicRows("invoices", { orderBy: "issued_at" });
  const rows = data ?? [];
  const money = (n: unknown) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: clinic?.currency ?? "USD",
    }).format(Number(n ?? 0));

  const paid = rows.filter((r) => r["status"] === "paid");
  const open = rows.filter((r) => r["status"] === "sent" || r["status"] === "overdue");

  return (
    <div>
      <PageHeader title="Invoices" description="Billing for treatments, products and services." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Invoices" value={rows.length} />
        <StatCard
          label="Collected"
          value={money(paid.reduce((s, r) => s + Number(r["total"]), 0))}
        />
        <StatCard
          label="Outstanding"
          value={money(open.reduce((s, r) => s + Number(r["total"]), 0))}
        />
      </div>
      <ResourceTable
        table="invoices"
        singular="Invoice"
        orderBy="issued_at"
        searchKeys={["number", "notes"]}
        columns={[
          { key: "number", label: "Number", className: "font-medium" },
          {
            key: "issued_at",
            label: "Issued",
            render: (r) => format(parseISO(String(r["issued_at"])), "d MMM yyyy"),
          },
          {
            key: "due_at",
            label: "Due",
            render: (r) =>
              r["due_at"] ? format(parseISO(String(r["due_at"])), "d MMM yyyy") : "—",
          },
          { key: "total", label: "Total", render: (r) => money(r["total"]) },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <Badge variant={tone[String(r["status"])] ?? "secondary"} className="capitalize">
                {String(r["status"])}
              </Badge>
            ),
          },
        ]}
        fields={[
          {
            name: "number",
            label: "Invoice number",
            required: true,
            placeholder: `INV-${new Date().getFullYear()}-001`,
          },
          { name: "customer_id", label: "Customer", type: "select", options: customers },
          { name: "pet_id", label: "Patient", type: "select", options: pets },
          { name: "issued_at", label: "Issue date", type: "date", required: true },
          { name: "due_at", label: "Due date", type: "date" },
          { name: "subtotal", label: "Subtotal", type: "number" },
          { name: "tax_rate", label: "Tax rate (%)", type: "number" },
          { name: "total", label: "Total", type: "number", required: true },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: ["draft", "sent", "paid", "overdue", "void"].map((v) => ({
              value: v,
              label: v,
            })),
          },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
