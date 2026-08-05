import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Check, CreditCard, RefreshCw } from "lucide-react";
import { PageHeader, StatCard } from "@/components/page-header";
import { RequireClinic } from "@/components/require-clinic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/lib/clinic-context";
import { useClinicRows } from "@/lib/data";
import {
  createBillingPortalSession,
  createCheckoutSession,
  syncStripeCatalog,
} from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/app/subscription")({
  head: () => ({
    meta: [
      { title: "Clinic Plan & Usage — Vetigo Operator Console" },
      { name: "description", content: "Assign clinic plans and review usage against your limits." },
    ],
  }),

  component: () => (
    <RequireClinic>
      <Subscription />
    </RequireClinic>
  ),
});

function Subscription() {
  const { clinic, refetch, isAdmin, isPlatformAdmin } = useClinic();
  const checkout = useServerFn(createCheckoutSession);
  const portal = useServerFn(createBillingPortalSession);
  const syncCatalog = useServerFn(syncStripeCatalog);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
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
      const { url } = await checkout({
        data: {
          clinicId: clinic!.id,
          planId,
          interval,
          origin: window.location.origin,
        },
      });
      if (!url) throw new Error("Stripe did not return a checkout URL");
      window.location.assign(url);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start checkout"),
  });

  const manage = useMutation({
    mutationFn: async () => {
      const { url } = await portal({
        data: { clinicId: clinic!.id, origin: window.location.origin },
      });
      window.location.assign(url);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not open billing portal"),
  });

  const sync = useMutation({
    mutationFn: () => syncCatalog({}),
    onSuccess: (r) => {
      toast.success(`Synced ${r.count} plans with Stripe`);
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Stripe sync failed"),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("checkout");
    if (!result) return;
    if (result === "success") {
      toast.success("Subscription confirmed — syncing from Stripe");
      refetch();
      void queryClient.invalidateQueries({ queryKey: ["rows"] });
    } else if (result === "cancelled") {
      toast.info("Checkout cancelled");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [queryClient, refetch]);

  const money = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div>
      <PageHeader
        title="Clinic plan & usage"
        description="Assign this clinic's plan and track its usage against your platform limits."
        actions={
          <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border p-0.5">
            {(["monthly", "yearly"] as const).map((i) => (
              <Button
                key={i}
                size="sm"
                variant={interval === i ? "default" : "ghost"}
                onClick={() => setInterval(i)}
                className="capitalize"
              >
                {i}
              </Button>
            ))}
          </div>
          {isAdmin && clinic?.stripe_customer_id && (
            <Button variant="outline" onClick={() => manage.mutate()} disabled={manage.isPending}>
              <CreditCard className="mr-2 size-4" /> Manage billing
            </Button>
          )}
          {isPlatformAdmin && (
            <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
              <RefreshCw className={`mr-2 size-4 ${sync.isPending ? "animate-spin" : ""}`} /> Sync Stripe catalog
            </Button>
          )}
          </div>
        }
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
              {trialDays > 0
                ? `${trialDays} days left in this clinic's trial`
                : "This clinic's trial has ended"}
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
                disabled={active || choose.isPending || !isAdmin}
                onClick={() => choose.mutate(plan.id)}
              >
                {active ? "Current plan" : `Subscribe to ${plan.name}`}
              </Button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
