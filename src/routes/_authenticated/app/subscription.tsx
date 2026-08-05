import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { PageHeader, StatCard } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/lib/clinic-context";
import { useClinicRows } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/subscription")({
  head: () => ({
    meta: [
      { title: "Subscription & Billing — SmartVet" },
      { name: "description", content: "Your clinic's plan, usage limits and billing period." },
    ],
  }),
  component: () => (
    <RequireClinic>
      <Subscription />
    </RequireClinic>
  ),
});

function Subscription() {
  const { clinic, refetch } = useClinic();
  const queryClient = useQueryClient();
  const pets = useClinicRows("pets", { select: "id" });
  const staff = useClinicRows("clinic_members", { select: "id" });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const currentPlan = (plans ?? []).find((p) => p.id === clinic?.plan_id) ?? null;
  const trialDays = clinic
    ? differenceInCalendarDays(parseISO(clinic.trial_ends_at), new Date())
    : 0;

  const choose = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from("clinics")
        .update({ plan_id: planId, subscription_status: "active" })
        .eq("id", clinic!.id);
      if (error) throw error;
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      const plan = (plans ?? []).find((p) => p.id === planId);
      await supabase.from("clinic_subscriptions").insert({
        clinic_id: clinic!.id,
        plan_id: planId,
        amount: plan?.price_monthly ?? 0,
        interval: "monthly",
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Plan updated");
      refetch();
      void queryClient.invalidateQueries({ queryKey: ["memberships"] });
      void queryClient.invalidateQueries({ queryKey: ["rows"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not change plan"),
  });

  const money = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div>
      <PageHeader
        title="Subscription"
        description="Each clinic is billed separately for its own workspace."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current plan" value={currentPlan?.name ?? "Trial"} />
        <StatCard
          label="Status"
          value={<Badge className="capitalize">{clinic?.subscription_status ?? "trialing"}</Badge>}
        />
        <StatCard
          label="Patients used"
          value={`${(pets.data ?? []).length} / ${currentPlan?.max_pets ?? "∞"}`}
        />
        <StatCard
          label="Staff seats"
          value={`${(staff.data ?? []).length} / ${currentPlan?.max_staff ?? "∞"}`}
        />
      </div>

      {clinic?.subscription_status === "trialing" && (
        <div className="surface-panel mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-medium">
              {trialDays > 0 ? `${trialDays} days left in your free trial` : "Your trial has ended"}
            </p>
            <p className="text-sm text-muted-foreground">
              Trial ends {clinic && format(parseISO(clinic.trial_ends_at), "d MMMM yyyy")}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {(plans ?? []).map((plan) => {
          const active = plan.id === clinic?.plan_id;
          const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
          return (
            <section
              key={plan.id}
              className={`surface-panel p-6 ${active ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                {active && <Badge>Current</Badge>}
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {money(Number(plan.price_monthly))}
                <span className="text-sm font-normal text-muted-foreground"> /month</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or {money(Number(plan.price_yearly))} billed yearly
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> Up to {plan.max_pets} patients
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> {plan.max_staff} staff seats
                </li>
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={active ? "outline" : "default"}
                disabled={active || choose.isPending}
                onClick={() => choose.mutate(plan.id)}
              >
                {active ? "Current plan" : `Switch to ${plan.name}`}
              </Button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
