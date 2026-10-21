import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { ResourceTable } from "@/components/resource-table";
import { useLookup, useClinicStaff } from "@/lib/data";
import {
  celsiusToFahrenheitInput,
  fahrenheitInputToCelsius,
  formatFahrenheit,
  formatLbs,
  kgToLbsInput,
  lbsInputToKg,
} from "@/lib/weight";

export const Route = createFileRoute("/_authenticated/app/examinations")({
  head: () => ({
    meta: [
      { title: "Examinations — Vetigo" },
      { name: "description", content: "Clinical notes, diagnoses, vitals and prescriptions." },
      { property: "og:title", content: "Examinations — Vetigo" },
      { property: "og:description", content: "Clinical notes, diagnoses, vitals and prescriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Examinations />
    </RequireClinic>
  ),
});

function Examinations() {
  const pets = useLookup("pets");
  const { data: staff } = useClinicStaff();
  return (
    <div>
      <PageHeader
        title="Examinations"
        description="A permanent clinical record for each patient visit."
      />
      <ResourceTable
        table="examinations"
        singular="Examination"
        orderBy="visited_at"
        searchKeys={["complaint", "diagnosis", "treatment"]}
        columns={[
          {
            key: "visited_at",
            label: "Visit",
            render: (r) => format(parseISO(String(r["visited_at"])), "d MMM yyyy · HH:mm"),
          },
          { key: "complaint", label: "Complaint" },
          { key: "diagnosis", label: "Diagnosis", className: "font-medium" },
          {
            key: "temperature_c",
            label: "Temp °F",
            render: (r) => formatFahrenheit(r["temperature_c"]),
          },
          { key: "weight_kg", label: "Weight", render: (r) => formatLbs(r["weight_kg"]) },
        ]}
        fields={[
          { name: "pet_id", label: "Patient", type: "select", options: pets, required: true },
          {
            name: "visited_at",
            label: "Visit date & time",
            type: "datetime-local",
            required: true,
          },
          {
            name: "vet_id",
            label: "Veterinarian",
            type: "select",
            options: (staff ?? []).map((s) => ({
              value: s.user_id,
              label: s.profiles?.full_name ?? s.profiles?.email ?? "Staff",
            })),
          },
          {
            name: "temperature_c",
            label: "Temperature (°F)",
            type: "number",
            toForm: celsiusToFahrenheitInput,
            fromForm: fahrenheitInputToCelsius,
          },
          { name: "heart_rate", label: "Heart rate (bpm)", type: "number" },
          {
            name: "weight_kg",
            label: "Weight (lbs)",
            type: "number",
            toForm: kgToLbsInput,
            fromForm: lbsInputToKg,
          },
          { name: "complaint", label: "Presenting complaint", type: "textarea" },
          { name: "diagnosis", label: "Diagnosis", type: "textarea" },
          { name: "treatment", label: "Treatment", type: "textarea" },
          { name: "prescription", label: "Prescription", type: "textarea" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
