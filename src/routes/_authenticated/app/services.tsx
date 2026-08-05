import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { ResourceTable } from "@/components/resource-table";
import { useClinic } from "@/lib/clinic-context";

export const Route = createFileRoute("/_authenticated/app/services")({
  head: () => ({
    meta: [
      { title: "Services & Pricing — SmartVet" },
      {
        name: "description",
        content: "The treatments this clinic offers, with duration and price.",
      },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Services />
    </RequireClinic>
  ),
});

function Services() {
  const { clinic } = useClinic();
  const money = (n: unknown) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: clinic?.currency ?? "USD",
    }).format(Number(n ?? 0));

  return (
    <div>
      <PageHeader title="Services" description="Your treatment catalogue and price list." />
      <ResourceTable
        table="services"
        singular="Service"
        searchKeys={["name", "category"]}
        columns={[
          { key: "name", label: "Service", className: "font-medium" },
          { key: "category", label: "Category" },
          { key: "duration_minutes", label: "Duration (min)" },
          { key: "price", label: "Price", render: (r) => money(r["price"]) },
        ]}
        fields={[
          { name: "name", label: "Service name", required: true },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: [
              "Consultation",
              "Surgery",
              "Vaccination",
              "Grooming",
              "Laboratory",
              "Dental",
              "Emergency Care",
              "Imaging",
            ].map((v) => ({ value: v, label: v })),
          },
          { name: "price", label: "Price", type: "number", required: true },
          { name: "duration_minutes", label: "Duration (minutes)", type: "number" },
          { name: "description", label: "Description", type: "textarea" },
        ]}
      />
    </div>
  );
}
