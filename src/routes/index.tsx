import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ShieldCheck,
  Syringe,
  Package,
  ReceiptText,
  BarChart3,
  Building2,
  PawPrint,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartVet — Multi-Clinic Veterinary Management Software" },
      {
        name: "description",
        content:
          "Run unlimited veterinary clinics from one platform. Appointments, patient records, vaccinations, inventory, invoicing and reports — each clinic fully isolated.",
      },
      { property: "og:title", content: "SmartVet — Multi-Clinic Veterinary Management Software" },
      {
        property: "og:description",
        content:
          "A subscription-based SaaS platform giving every veterinary clinic its own independent panel and data.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Appointment calendar",
    body: "Colour-coded week view with per-vet scheduling and status tracking.",
  },
  {
    icon: PawPrint,
    title: "Patient records",
    body: "Owners, pets, breeds, weights, microchips and full clinical history.",
  },
  {
    icon: Syringe,
    title: "Vaccination reminders",
    body: "Automatic next-due dates so no booster is ever missed.",
  },
  {
    icon: Package,
    title: "Inventory control",
    body: "Stock levels, reorder thresholds, expiry dates and stock value.",
  },
  {
    icon: ReceiptText,
    title: "Invoicing",
    body: "Bill treatments and products, track paid and outstanding balances.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    body: "Revenue, visit volume and service mix over a rolling six months.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <span className="flex items-center gap-2 font-semibold">
            <PawPrint className="size-5 text-primary" /> SmartVet
          </span>
          <div className="flex-1" />
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Start free trial</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <Building2 className="size-3.5" /> Multi-tenant SaaS for veterinary groups
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Manage unlimited veterinary clinics from a single platform
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Every clinic gets its own independent panel, staff, patients and billing — while you keep
            an overview of the whole group.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">Create your clinic</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">See the panel</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            14-day trial · no card required · cancel anytime
          </p>
        </section>

        <section className="border-y bg-card/40 py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-center text-2xl font-semibold">Everything a clinic runs on</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.title} className="surface-panel p-6">
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Strict data isolation, by design</h2>
              <p className="mt-4 text-muted-foreground">
                Row-level security scopes every record to a single clinic. Staff only ever see the
                clinic they belong to, and roles decide what they can change.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Owner, admin, veterinarian and staff roles",
                  "Per-clinic subscription and usage limits",
                  "Optional public website for each clinic",
                  "Platform-wide overview of every clinic you run",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface-panel p-8">
              <ShieldCheck className="size-8 text-primary" />
              <p className="mt-4 text-lg font-medium">
                “We moved four clinics onto SmartVet in a weekend and finally have one place to see
                how the group is performing.”
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Practice manager, multi-site veterinary group
              </p>
            </div>
          </div>
        </section>

        <section className="border-t bg-primary py-16 text-center text-primary-foreground">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-3xl font-semibold">Ready to open your first clinic panel?</h2>
            <p className="mt-3 text-primary-foreground/80">
              Start on the free trial and invite your team in minutes.
            </p>
            <Button size="lg" variant="secondary" className="mt-7" asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SmartVet — veterinary clinic management platform
      </footer>
    </div>
  );
}
