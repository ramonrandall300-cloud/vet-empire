import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { ResourceTable } from "@/components/resource-table";
import { useLookup } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/pets")({
  head: () => ({
    meta: [
      { title: "Patients — SmartVet" },
      { name: "description", content: "Complete medical profile for every animal in your care." },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Pets />
    </RequireClinic>
  ),
});

function Pets() {
  const customers = useLookup("customers", "full_name");
  return (
    <div>
      <PageHeader title="Pets" description="Patient profiles, species, breed and vitals." />
      <ResourceTable
        table="pets"
        singular="Pet"
        searchKeys={["name", "species", "breed", "microchip"]}
        columns={[
          { key: "name", label: "Name", className: "font-medium" },
          { key: "species", label: "Species" },
          { key: "breed", label: "Breed" },
          {
            key: "sex",
            label: "Sex",
            render: (r) => <span className="capitalize">{String(r["sex"])}</span>,
          },
          {
            key: "birth_date",
            label: "Born",
            render: (r) =>
              r["birth_date"] ? format(parseISO(String(r["birth_date"])), "d MMM yyyy") : "—",
          },
          { key: "weight_kg", label: "Weight (kg)" },
        ]}
        fields={[
          { name: "name", label: "Pet name", required: true },
          { name: "customer_id", label: "Owner", type: "select", options: customers },
          {
            name: "species",
            label: "Species",
            type: "select",
            options: ["Dog", "Cat", "Bird", "Rabbit", "Reptile", "Rodent", "Other"].map((v) => ({
              value: v,
              label: v,
            })),
          },
          { name: "breed", label: "Breed" },
          {
            name: "sex",
            label: "Sex",
            type: "select",
            options: ["male", "female", "unknown"].map((v) => ({ value: v, label: v })),
          },
          { name: "birth_date", label: "Birth date", type: "date" },
          { name: "weight_kg", label: "Weight (kg)", type: "number" },
          { name: "color", label: "Colour" },
          { name: "microchip", label: "Microchip number" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
