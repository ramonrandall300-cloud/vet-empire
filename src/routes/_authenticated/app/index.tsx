import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, parseISO } from "date-fns";
import {
  CalendarDays,
  Users,
  PawPrint,
  Syringe,
  AlertTriangle,
  ReceiptText,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/lib/clinic-context";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Clinic Dashboard — SmartVet" },
      { name: "description", content: "Daily overview of appointments, patients and revenue." },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Dashboard />
    </RequireClinic>
  ),
});

function useDashboard() {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["dashboard", clinic?.id],
    enabled: Boolean(clinic?.id),
    queryFn: async () => {
      const id = clinic!.id;
      const today = new Date();
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const [customers, pets, appts, dueVaccines, invoices, lowStock] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("clinic_id", id),
        supabase.from("pets").select("id", { count: "exact", head: true }).eq("clinic_id", id),
        supabase
          .from("appointments")
          .select("id, starts_at, status, reason, pets(name), customers(full_name), services(name)")
          .eq("clinic_id", id)
          .gte("starts_at", start.toISOString())
          .order("starts_at", { ascending: true })
          .limit(30),
        supabase
          .from("vaccinations")
          .select("id, vaccine_name, next_due_at, pets(name)")
          .eq("clinic_id", id)
          .not("next_due_at", "is", null)
          .order("next_due_at", { ascending: true })
          .limit(6),
        supabase.from("invoices").select("total, status").eq("clinic_id", id),
        supabase.from("inventory_items").select("name, quantity, reorder_level, unit").eq("clinic_id", id),
      ]);

      const paid = (invoices.data ?? []).filter((i) => i.status === "paid");
      const outstanding = (invoices.data ?? []).filter((i) => i.status !== "paid" && i.status !== "void");

      return {
        customers: customers.count ?? 0,
        pets: pets.count ?? 0,
        appointments: appts.data ?? [],
        dueVaccines: dueVaccines.data ?? [],
        revenue: paid.reduce((s, i) => s + Number(i.total ?? 0), 0),
        outstanding: outstanding.reduce((s, i) => s + Number(i.total ?? 0), 0),
        lowStock: (lowStock.data ?? []).filter(
          (i) => Number(i.quantity) <= Number(i.reorder_level),
        ),
      };
    },
  });
}

const statusTone: Record<string, string> = {
  scheduled: "bg-info/15 text-info",
  confirmed: "bg-success/15 text-success",
  in_progress: "bg-warning/20 text-warning-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  no_show: "bg-destructive/15 text-destructive",
};

function Dashboard() {
  const { clinic } = useClinic();
  const { data } = useDashboard();
  const currency = clinic?.currency ?? "USD";
  const money = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const todays = (data?.appointments ?? []).filter((a) => isToday(parseISO(a.starts_at)));

  return (
    <div>
      <PageHeader
        title={`Good day at ${clinic?.name ?? "your clinic"}`}
        description={format(new Date(), "EEEE, d MMMM yyyy")}
        actions={
          <Button asChild>
            <Link to="/app/appointments">
              <CalendarDays className="size-4" /> Open calendar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Appointments today"
          value={todays.length}
          hint={`${data?.appointments.length ?? 0} upcoming total`}
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard label="Customers" value={data?.customers ?? 0} icon={<Users className="size-5" />} />
        <StatCard label="Patients" value={data?.pets ?? 0} icon={<PawPrint className="size-5" />} />
        <StatCard
          label="Collected revenue"
          value={money(data?.revenue ?? 0)}
          hint={`${money(data?.outstanding ?? 0)} outstanding`}
          icon={<ReceiptText className="size-5" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="surface-panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Upcoming appointments</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/appointments">
                View all <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          <ul className="divide-y">
            {(data?.appointments ?? []).slice(0, 7).map((a) => (
              <li key={a.id} className="flex items-center gap-4 py-3">
                <div className="w-20 shrink-0 text-sm">
                  <p className="font-semibold">{format(parseISO(a.starts_at), "HH:mm")}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(a.starts_at), "d MMM")}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {a.pets?.name ?? "Patient"} · {a.services?.name ?? a.reason ?? "Consultation"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.customers?.full_name ?? "Walk-in"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusTone[a.status] ?? "bg-muted"}`}
                >
                  {a.status.replace("_", " ")}
                </span>
              </li>
            ))}
            {!data?.appointments.length && (
              <li className="py-10 text-center text-sm text-muted-foreground">
                Nothing booked yet — create an appointment to fill the calendar.
              </li>
            )}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="surface-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <Syringe className="size-4 text-primary" /> Vaccinations due
            </h2>
            <ul className="space-y-3">
              {(data?.dueVaccines ?? []).map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{v.pets?.name ?? "Patient"}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {v.vaccine_name}
                    </span>
                  </span>
                  <Badge variant="secondary">
                    {v.next_due_at ? format(parseISO(v.next_due_at), "d MMM") : "—"}
                  </Badge>
                </li>
              ))}
              {!data?.dueVaccines.length && (
                <li className="text-sm text-muted-foreground">No scheduled doses.</li>
              )}
            </ul>
          </section>

          <section className="surface-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="size-4 text-warning" /> Low stock
            </h2>
            <ul className="space-y-3">
              {(data?.lowStock ?? []).slice(0, 5).map((i) => (
                <li key={i.name} className="flex items-center justify-between text-sm">
                  <span className="truncate">{i.name}</span>
                  <span className="text-muted-foreground">
                    {Number(i.quantity)} {i.unit}
                  </span>
                </li>
              ))}
              {!data?.lowStock.length && (
                <li className="text-sm text-muted-foreground">Everything is well stocked.</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
