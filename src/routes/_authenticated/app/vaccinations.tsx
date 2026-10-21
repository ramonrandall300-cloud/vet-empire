import { createFileRoute } from "@tanstack/react-router";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { PageHeader, StatCard } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { ResourceTable } from "@/components/resource-table";
import { Badge } from "@/components/ui/badge";
import { useClinicRows, useLookup, useClinicStaff } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/vaccinations")({
  head: () => ({
    meta: [
      { title: "Vaccination Schedule — Vetigo" },
      { name: "description", content: "Track doses given and upcoming vaccine reminders." },
      { property: "og:title", content: "Vaccination Schedule — Vetigo" },
      { property: "og:description", content: "Track doses given and upcoming vaccine reminders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Vaccinations />
    </RequireClinic>
  ),
});

function Vaccinations() {
  const pets = useLookup("pets");
  const { data: staff } = useClinicStaff();
  const { data } = useClinicRows("vaccinations", { orderBy: "next_due_at", ascending: true });

  const rows = data ?? [];
  const overdue = rows.filter(
    (r) =>
      r["next_due_at"] &&
      differenceInCalendarDays(parseISO(String(r["next_due_at"])), new Date()) < 0,
  ).length;
  const soon = rows.filter((r) => {
    if (!r["next_due_at"]) return false;
    const d = differenceInCalendarDays(parseISO(String(r["next_due_at"])), new Date());
    return d >= 0 && d <= 30;
  }).length;

  return (
    <div>
      <PageHeader
        title="Vaccination Schedule"
        description="Every dose, batch number and the next due date per patient."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total records" value={rows.length} />
        <StatCard label="Due in 30 days" value={soon} />
        <StatCard label="Overdue" value={overdue} />
      </div>
      <ResourceTable
        table="vaccinations"
        singular="Vaccination"
        orderBy="next_due_at"
        ascending
        searchKeys={["vaccine_name", "batch_number"]}
        columns={[
          { key: "vaccine_name", label: "Vaccine", className: "font-medium" },
          { key: "dose", label: "Dose" },
          {
            key: "given_at",
            label: "Given",
            render: (r) =>
              r["given_at"] ? format(parseISO(String(r["given_at"])), "d MMM yyyy") : "—",
          },
          {
            key: "next_due_at",
            label: "Next due",
            render: (r) => {
              if (!r["next_due_at"]) return "—";
              const days = differenceInCalendarDays(parseISO(String(r["next_due_at"])), new Date());
              return (
                <Badge variant={days < 0 ? "destructive" : days <= 30 ? "default" : "secondary"}>
                  {format(parseISO(String(r["next_due_at"])), "d MMM yyyy")}
                </Badge>
              );
            },
          },
          { key: "batch_number", label: "Batch" },
        ]}
        fields={[
          { name: "pet_id", label: "Patient", type: "select", options: pets, required: true },
          { name: "vaccine_name", label: "Vaccine", required: true },
          { name: "dose", label: "Dose" },
          { name: "given_at", label: "Date given", type: "date" },
          { name: "next_due_at", label: "Next due", type: "date" },
          { name: "batch_number", label: "Batch number" },
          {
            name: "vet_id",
            label: "Administered by",
            type: "select",
            options: (staff ?? []).map((s) => ({
              value: s.user_id,
              label: s.profiles?.full_name ?? s.profiles?.email ?? "Staff",
            })),
          },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
