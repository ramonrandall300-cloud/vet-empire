import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { ResourceTable } from "@/components/resource-table";
import { useLookup } from "@/lib/data";
import { formatLbs, kgToLbsInput, lbsInputToKg } from "@/lib/weight";

export const Route = createFileRoute("/_authenticated/app/pets")({
  head: () => ({
    meta: [
      { title: "Patients — Vetigo" },
      { name: "description", content: "Complete medical profile for every animal in your care." },
      { property: "og:title", content: "Patients — Vetigo" },
      { property: "og:description", content: "Complete medical profile for every animal in your care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
          { key: "weight_kg", label: "Weight", render: (r) => formatLbs(r["weight_kg"]) },
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
          {
            name: "weight_kg",
            label: "Weight (lbs)",
            type: "number",
            toForm: kgToLbsInput,
            fromForm: lbsInputToKg,
          },
          { name: "color", label: "Colour" },
          { name: "microchip", label: "Microchip number" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
