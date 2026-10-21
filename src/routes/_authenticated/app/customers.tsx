import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { ResourceTable } from "@/components/resource-table";

export const Route = createFileRoute("/_authenticated/app/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Vetigo" },
      { name: "description", content: "Pet owner records, contact details and visit notes." },
      { property: "og:title", content: "Customers — Vetigo" },
      { property: "og:description", content: "Pet owner records, contact details and visit notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireClinic>
      <div>
        <PageHeader title="Customers" description="Pet owners registered with this clinic." />
        <ResourceTable
          table="customers"
          singular="Customer"
          searchKeys={["full_name", "email", "phone"]}
          columns={[
            { key: "full_name", label: "Name", className: "font-medium" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "address", label: "Address" },
          ]}
          fields={[
            { name: "full_name", label: "Full name", required: true },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "email", label: "Email", type: "email" },
            { name: "address", label: "Address", colSpan: 2 },
            { name: "notes", label: "Notes", type: "textarea" },
          ]}
        />
      </div>
    </RequireClinic>
  ),
});
