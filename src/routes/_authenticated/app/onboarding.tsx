import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Check, Globe, MapPin, PackageCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useClinic, useCurrentUser } from "@/lib/clinic-context";

export const Route = createFileRoute("/_authenticated/app/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboard a Clinic — Vetigo Operator Console" },
      {
        name: "description",
        content:
          "Guided onboarding for a new veterinary clinic: profile, location, plan and starter data.",
      },
      { property: "og:title", content: "Onboard a Clinic — Vetigo" },
      {
        property: "og:description",
        content: "Set up a new clinic tenant with its plan, trial and starter records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

const TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC",
];

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "TRY", "AED"];

const DEFAULT_SERVICES = [
  { name: "General consultation", category: "Consultation", price: 65, duration_minutes: 30 },
  { name: "Vaccination", category: "Preventive", price: 45, duration_minutes: 20 },
  { name: "Dental cleaning", category: "Dentistry", price: 220, duration_minutes: 60 },
  { name: "Surgery (routine)", category: "Surgery", price: 480, duration_minutes: 120 },
  { name: "Grooming", category: "Wellness", price: 55, duration_minutes: 45 },
  { name: "Lab work / blood panel", category: "Diagnostics", price: 95, duration_minutes: 20 },
];

const DEFAULT_HOURS = {
  mon: "09:00-18:00",
  tue: "09:00-18:00",
  wed: "09:00-18:00",
  thu: "09:00-18:00",
  fri: "09:00-18:00",
  sat: "10:00-14:00",
  sun: "closed",
};

const STEPS = [
  { title: "Clinic profile", icon: Building2 },
  { title: "Location & locale", icon: MapPin },
  { title: "Plan & trial", icon: Sparkles },
  { title: "Starter data", icon: PackageCheck },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { setClinicId, refetch } = useClinic();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    timezone: "America/Chicago",
    currency: "USD",
    about: "",
    interval: "monthly" as "monthly" | "yearly",
    planId: "",
    seedServices: true,
    createWebsite: true,
    setBusinessHours: true,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

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

  const selectedPlan = useMemo(
    () => (plans ?? []).find((p) => p.id === form.planId) ?? null,
    [plans, form.planId],
  );

  const trialEnds = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }, []);

  const create = useMutation({
    mutationFn: async () => {
      const trialEndsAt = trialEnds.toISOString();
      const { data: clinic, error } = await supabase
        .from("clinics")
        .insert({
          name: form.name.trim(),
          slug: `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`,
          owner_id: user!.id,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          timezone: form.timezone,
          currency: form.currency,
          plan_id: form.planId || null,
          subscription_status: "trialing",
          trial_ends_at: trialEndsAt,
          ...(form.setBusinessHours ? { opening_hours: DEFAULT_HOURS } : {}),
        })
        .select("id, slug")
        .single();
      if (error) throw error;

      const { error: memberError } = await supabase
        .from("clinic_members")
        .insert({ clinic_id: clinic.id, user_id: user!.id, role: "owner" });
      if (memberError) throw memberError;

      if (selectedPlan) {
        const amount =
          form.interval === "yearly"
            ? Number(selectedPlan.price_yearly)
            : Number(selectedPlan.price_monthly);
        const periodEnd = new Date(trialEnds);
        if (form.interval === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        else periodEnd.setMonth(periodEnd.getMonth() + 1);
        const { error: subError } = await supabase.from("clinic_subscriptions").insert({
          clinic_id: clinic.id,
          plan_id: selectedPlan.id,
          status: "trialing",
          interval: form.interval,
          amount,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
        });
        if (subError) throw subError;
      }

      if (form.seedServices) {
        const { error: svcError } = await supabase.from("services").insert(
          DEFAULT_SERVICES.map((s) => ({
            ...s,
            clinic_id: clinic.id,
          })),
        );
        if (svcError) throw svcError;
      }

      if (form.createWebsite) {
        const { error: siteError } = await supabase.from("clinic_websites").insert({
          clinic_id: clinic.id,
          is_published: false,
          headline: `${form.name.trim()} — compassionate veterinary care`,
          tagline: form.city.trim() ? `Trusted pet care in ${form.city.trim()}` : null,
          about: form.about.trim() || null,
          contact_email: form.email.trim() || null,
          contact_phone: form.phone.trim() || null,
        });
        if (siteError) throw siteError;
      }

      return clinic.id;
    },
    onSuccess: (id) => {
      toast.success("Clinic onboarded — 30-day trial started");
      setClinicId(id);
      refetch();
      void queryClient.invalidateQueries({ queryKey: ["memberships"] });
      navigate({ to: "/app" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not onboard clinic"),
  });

  const canContinue =
    step === 0 ? form.name.trim().length > 1 : step === 2 ? Boolean(form.planId) : true;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Onboard a clinic"
        description="Four quick steps to spin up an isolated clinic tenant with its own plan and starter records."
      />

      <ol className="mb-6 grid gap-3 sm:grid-cols-4">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={s.title}
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                active
                  ? "border-primary bg-primary/5 font-medium"
                  : done
                    ? "border-transparent bg-muted text-muted-foreground"
                    : "border-transparent bg-muted/50 text-muted-foreground"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full ${
                  active || done ? "bg-primary text-primary-foreground" : "bg-background"
                }`}
              >
                {done ? <Check className="size-4" /> : <s.icon className="size-4" />}
              </span>
              <span className="truncate">{s.title}</span>
            </li>
          );
        })}
      </ol>

      <div className="surface-panel space-y-5 p-6">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="ob-name">Clinic name</Label>
              <Input
                id="ob-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Green Valley Veterinary"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ob-email">Clinic email</Label>
                <Input
                  id="ob-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="hello@clinic.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-phone">Phone</Label>
                <Input
                  id="ob-phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ob-about">Short description (optional)</Label>
              <Textarea
                id="ob-about"
                rows={3}
                value={form.about}
                onChange={(e) => set("about", e.target.value)}
                placeholder="Full-service small animal practice with surgery and dentistry."
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="ob-address">Street address</Label>
              <Input
                id="ob-address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ob-city">City</Label>
                <Input
                  id="ob-city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-country">Country</Label>
                <Input
                  id="ob-country"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={form.setBusinessHours}
                onCheckedChange={(v) => set("setBusinessHours", v === true)}
              />
              <span className="text-sm">
                Apply standard opening hours
                <span className="block text-xs text-muted-foreground">
                  Mon–Fri 09:00–18:00, Sat 10:00–14:00, Sun closed. Editable later.
                </span>
              </span>
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">Billing interval</span>
              <div className="flex rounded-lg border p-1">
                {(["monthly", "yearly"] as const).map((i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={form.interval === i ? "default" : "ghost"}
                    onClick={() => set("interval", i)}
                    className="capitalize"
                  >
                    {i}
                  </Button>
                ))}
              </div>
              <Badge variant="secondary">30-day free trial</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(plans ?? []).map((plan) => {
                const active = plan.id === form.planId;
                const price =
                  form.interval === "yearly"
                    ? Number(plan.price_yearly)
                    : Number(plan.price_monthly);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => set("planId", plan.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      active ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{plan.name}</span>
                      {active && <Check className="size-4 text-primary" />}
                    </div>
                    <p className="mt-1 text-lg font-semibold">
                      ${price.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{form.interval === "yearly" ? "yr" : "mo"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Up to {plan.max_staff} staff · {plan.max_pets.toLocaleString()} patients
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Trial ends {trialEnds.toLocaleDateString("en-US", { dateStyle: "long" })}; the clinic
              starts in trialing status and can be activated from Subscription.
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <label className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={form.seedServices}
                onCheckedChange={(v) => set("seedServices", v === true)}
              />
              <span className="text-sm">
                Add a starter service catalogue
                <span className="block text-xs text-muted-foreground">
                  {DEFAULT_SERVICES.map((s) => s.name).join(", ")}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={form.createWebsite}
                onCheckedChange={(v) => set("createWebsite", v === true)}
              />
              <span className="text-sm">
                Create an unpublished public website draft
                <span className="block text-xs text-muted-foreground">
                  Pre-filled headline and contact details — publish later from Website Management.
                </span>
              </span>
            </label>

            <div className="rounded-xl border bg-muted/40 p-4 text-sm">
              <p className="mb-2 flex items-center gap-2 font-medium">
                <Globe className="size-4" /> Review
              </p>
              <dl className="grid gap-1 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Clinic</dt>
                  <dd>{form.name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Location</dt>
                  <dd>{[form.city, form.country].filter(Boolean).join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Plan</dt>
                  <dd>
                    {selectedPlan ? `${selectedPlan.name} · ${form.interval}` : "No plan selected"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Locale</dt>
                  <dd>
                    {form.timezone} · {form.currency}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? navigate({ to: "/app/clinics" }) : setStep(step - 1))}
            disabled={create.isPending}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canContinue}>
              Continue
            </Button>
          ) : (
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.name.trim()}>
              {create.isPending ? "Onboarding…" : "Onboard clinic"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
