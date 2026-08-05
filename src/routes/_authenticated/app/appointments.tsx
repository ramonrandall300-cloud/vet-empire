import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, isSameDay, parseISO, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { ResourceTable } from "@/components/resource-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClinicRows, useLookup, useClinicStaff } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/appointments")({
  head: () => ({
    meta: [
      { title: "Appointment Calendar — Vetigo" },
      { name: "description", content: "Book, reschedule and track every clinic appointment." },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Appointments />
    </RequireClinic>
  ),
});

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i);

const statusTone: Record<string, string> = {
  scheduled: "border-info bg-info/10",
  confirmed: "border-success bg-success/10",
  in_progress: "border-warning bg-warning/15",
  completed: "border-border bg-muted",
  cancelled: "border-destructive bg-destructive/10",
  no_show: "border-destructive bg-destructive/10",
};

function WeekCalendar() {
  const [anchor, setAnchor] = useState(new Date());
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const { data } = useClinicRows("appointments", {
    select: "id, starts_at, status, reason, pets(name), services(name)",
    orderBy: "starts_at",
    ascending: true,
  });

  const items = useMemo(
    () =>
      (data ?? []).map((a) => ({
        id: String(a["id"]),
        at: parseISO(String(a["starts_at"])),
        status: String(a["status"]),
        label:
          (a["pets"] as { name?: string } | null)?.name ?? (a["reason"] as string) ?? "Appointment",
        service: (a["services"] as { name?: string } | null)?.name ?? "",
      })),
    [data],
  );

  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
          Today
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setAnchor(subWeeks(anchor, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setAnchor(addWeeks(anchor, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <p className="text-base font-semibold">{format(weekStart, "MMMM yyyy")}</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b bg-muted/40">
            <div />
            {days.map((d) => (
              <div key={d.toISOString()} className="p-3 text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {format(d, "EEE")}
                </p>
                <p
                  className={`mx-auto mt-1 grid size-8 place-items-center rounded-full text-sm font-semibold ${
                    isSameDay(d, new Date()) ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  {format(d, "d")}
                </p>
              </div>
            ))}
          </div>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid min-h-16 grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b last:border-0"
            >
              <div className="border-r p-2 text-xs text-muted-foreground">
                {String(hour).padStart(2, "0")}:00
              </div>
              {days.map((d) => {
                const slot = items.filter((i) => isSameDay(i.at, d) && i.at.getHours() === hour);
                return (
                  <div key={d.toISOString() + hour} className="border-r p-1 last:border-0">
                    {slot.map((i) => (
                      <div
                        key={i.id}
                        className={`mb-1 rounded-md border-l-4 px-2 py-1 text-xs ${statusTone[i.status] ?? "bg-muted"}`}
                      >
                        <p className="truncate font-semibold">
                          {format(i.at, "HH:mm")} · {i.label}
                        </p>
                        {i.service && <p className="truncate opacity-70">{i.service}</p>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Appointments() {
  const pets = useLookup("pets");
  const customers = useLookup("customers", "full_name");
  const services = useLookup("services");
  const { data: staff } = useClinicStaff();

  return (
    <div>
      <PageHeader
        title="Appointment Calendar"
        description="A shared schedule for every veterinarian in this clinic."
      />
      <Tabs defaultValue="calendar">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Week</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <WeekCalendar />
        </TabsContent>
        <TabsContent value="list">
          <ResourceTable
            table="appointments"
            singular="Appointment"
            orderBy="starts_at"
            searchKeys={["reason", "notes"]}
            columns={[
              {
                key: "starts_at",
                label: "When",
                render: (r) => format(parseISO(String(r["starts_at"])), "d MMM yyyy · HH:mm"),
              },
              { key: "reason", label: "Reason" },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <span className="capitalize">{String(r["status"]).replace("_", " ")}</span>
                ),
              },
              { key: "duration_minutes", label: "Minutes" },
            ]}
            fields={[
              { name: "starts_at", label: "Date & time", type: "datetime-local", required: true },
              { name: "duration_minutes", label: "Duration (minutes)", type: "number" },
              { name: "pet_id", label: "Patient", type: "select", options: pets },
              { name: "customer_id", label: "Owner", type: "select", options: customers },
              { name: "service_id", label: "Service", type: "select", options: services },
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
                name: "status",
                label: "Status",
                type: "select",
                options: [
                  "scheduled",
                  "confirmed",
                  "in_progress",
                  "completed",
                  "cancelled",
                  "no_show",
                ].map((v) => ({ value: v, label: v.replace("_", " ") })),
              },
              { name: "reason", label: "Reason", colSpan: 2 },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
