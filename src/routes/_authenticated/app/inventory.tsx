import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { PageHeader, StatCard } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { ResourceTable } from "@/components/resource-table";
import { Badge } from "@/components/ui/badge";
import { useClinic } from "@/lib/clinic-context";
import { useClinicRows } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Vetigo" },
      { name: "description", content: "Medicines, consumables, stock levels and expiry dates." },
      { property: "og:title", content: "Inventory — Vetigo" },
      { property: "og:description", content: "Medicines, consumables, stock levels and expiry dates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Inventory />
    </RequireClinic>
  ),
});

function Inventory() {
  const { clinic } = useClinic();
  const { data } = useClinicRows("inventory_items", { orderBy: "name", ascending: true });
  const rows = data ?? [];
  const money = (n: unknown) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: clinic?.currency ?? "USD",
    }).format(Number(n ?? 0));

  const low = rows.filter((r) => Number(r["quantity"]) <= Number(r["reorder_level"])).length;
  const value = rows.reduce((s, r) => s + Number(r["quantity"]) * Number(r["cost_price"]), 0);

  return (
    <div>
      <PageHeader title="Inventory" description="Stock control for medicines and consumables." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Items tracked" value={rows.length} />
        <StatCard label="Needs reorder" value={low} />
        <StatCard label="Stock value" value={money(value)} />
      </div>
      <ResourceTable
        table="inventory_items"
        singular="Item"
        orderBy="name"
        ascending
        searchKeys={["name", "sku", "category", "supplier"]}
        columns={[
          { key: "name", label: "Item", className: "font-medium" },
          { key: "sku", label: "SKU" },
          { key: "category", label: "Category" },
          {
            key: "quantity",
            label: "In stock",
            render: (r) => (
              <Badge
                variant={
                  Number(r["quantity"]) <= Number(r["reorder_level"]) ? "destructive" : "secondary"
                }
              >
                {Number(r["quantity"])} {String(r["unit"] ?? "")}
              </Badge>
            ),
          },
          { key: "sale_price", label: "Sale price", render: (r) => money(r["sale_price"]) },
          {
            key: "expires_at",
            label: "Expires",
            render: (r) =>
              r["expires_at"] ? format(parseISO(String(r["expires_at"])), "d MMM yyyy") : "—",
          },
        ]}
        fields={[
          { name: "name", label: "Item name", required: true },
          { name: "sku", label: "SKU" },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: ["Medicine", "Vaccine", "Consumable", "Food", "Equipment", "Other"].map(
              (v) => ({ value: v, label: v }),
            ),
          },
          { name: "supplier", label: "Supplier" },
          { name: "quantity", label: "Quantity", type: "number", required: true },
          { name: "unit", label: "Unit", placeholder: "pcs, ml, box" },
          { name: "reorder_level", label: "Reorder level", type: "number" },
          { name: "cost_price", label: "Cost price", type: "number" },
          { name: "sale_price", label: "Sale price", type: "number" },
          { name: "expires_at", label: "Expiry date", type: "date" },
        ]}
      />
    </div>
  );
}
