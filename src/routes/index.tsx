import { createFileRoute, Link } from "@tanstack/react-router";

import heroImage from "@/assets/hero-vet.png.asset.json";
import howItWorksImage from "@/assets/how-it-works-vet.png.asset.json";
import testimonialImage from "@/assets/testimonial-vet.png.asset.json";
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  CreditCard,
  Mail,
  PawPrint,
  Quote,
  Rocket,
  ShieldCheck,
  Syringe,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vetigo — Veterinary Practice Management Software" },
      {
        name: "description",
        content:
          "Cloud practice management software for veterinary clinics: scheduling, medical records, vaccinations, inventory and billing. Plans from $99/month.",
      },
      { property: "og:title", content: "Vetigo — Veterinary Practice Management Software" },
      {
        property: "og:description",
        content:
          "Run your clinic on one platform: appointments, records, reminders, inventory and invoicing. Free 30-day trial, no credit card required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://vetigo.pet/" },
    ],
    links: [{ rel: "canonical", href: "https://vetigo.pet/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Vetigo",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://vetigo.pet/",
          description:
            "Cloud practice management software for veterinary clinics: scheduling, medical records, vaccinations, inventory and billing.",
          offers: {
            "@type": "Offer",
            price: "99",
            priceCurrency: "USD",
          },
        }),
      },
    ],
  }),
  component: Landing,
});

const plans = [
  {
    name: "Starter",
    price: "$99",
    best: "Solo veterinarian, startup clinic",
    features: [
      "1 location",
      "Up to 3 users",
      "Unlimited pets & clients",
      "Appointment scheduling",
      "Medical records & exams",
      "Vaccination tracking",
      "Invoices & billing",
      "Basic reporting",
      "Cloud hosted with backups",
    ],
  },
  {
    name: "Professional",
    price: "$249",
    best: "Small clinic (2–5 veterinarians)",
    highlight: true,
    features: [
      "Everything in Starter, plus:",
      "Up to 10 users",
      "Inventory management",
      "Services & price catalog",
      "Role-based permissions",
      "PDF report exports",
    ],
  },
  {
    name: "Growth",
    price: "$499",
    best: "Multi-doctor practice",
    features: [
      "Everything in Professional, plus:",
      "Unlimited users",
      "Multi-location (up to 5)",
      "Financial & practice reports",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "$999",
    best: "Hospital groups & corporate networks",
    features: [
      "Everything in Growth, plus:",
      "Unlimited locations",
      "Dedicated account manager",
      "Data migration assistance",
      "Onboarding & training",
    ],
  },
];


const steps = [
  {
    icon: Rocket,
    title: "1. Start your trial",
    body: "Create your clinic workspace in minutes — 30 days free, full functionality, no credit card required.",
  },
  {
    icon: Upload,
    title: "2. Set up your clinic",
    body: "Add your clinic details, invite your team and build your services list with the guided setup wizard.",
  },
  {
    icon: ClipboardList,
    title: "3. Run your day",
    body: "Book appointments, chart exams, track vaccinations and invoice at checkout from one screen.",
  },
  {
    icon: Activity,
    title: "4. Grow your practice",
    body: "Add users, locations and reporting as your practice expands — upgrade your plan without migrating data.",
  },
];

const faqs = [
  {
    q: "How does the 30-day free trial work?",
    a: "You get full functionality for 30 days with no credit card required, including guided setup and email support. Choose a plan whenever you're ready — nothing is charged automatically.",
  },
  {
    q: "Do you charge per patient or per medical record?",
    a: "No. Pricing is based on clinic size — locations and users — so unlimited pets, clients and records are included on every plan. You are never penalised for growing your caseload.",
  },
  {
    q: "Can I change plans or add users later?",
    a: "Yes. Upgrade, downgrade or add seats at any time from your subscription page, and billing prorates from the change.",
  },
  {
    q: "Are there any discounts available?",
    a: "We offer 20% off for non-profit rescue organisations, 50% off for veterinary schools, and volume discounts for multi-clinic groups.",
  },
  {
    q: "Can you help us move data from our current system?",
    a: "Yes. Guided data migration services range from $500 to $5,000 depending on volume and source system. Staff onboarding is $500 and custom training is $200/hour.",
  },
  {
    q: "How is our clinic data kept separate and secure?",
    a: "Every clinic runs on an isolated dataset enforced at the database level with row-level security, encrypted in transit and at rest, with automated cloud backups.",
  },
];

const testimonials = [
  {
    quote:
      "We replaced three tools with Vetigo. Scheduling, medical records and invoicing finally live in one place, so nothing gets lost between the exam room and checkout.",
    name: "Dr. Elena Marsh",
    role: "Owner, Green Valley Veterinary",
  },
  {
    quote:
      "Rolling out five locations took a week. Each clinic sees only its own patients, but I still get practice-wide reports every Monday morning.",
    name: "Dr. Priya Raman",
    role: "Medical Director, Northgate Animal Group",
  },
  {
    quote:
      "Charting exams and vaccinations takes a fraction of the time it used to, and our records are more complete than they've ever been.",
    name: "Dr. Tom Okafor",
    role: "Small Animal Vet, Riverbend Clinic",
  },
];

const nav = [
  ["How it works", "#how-it-works"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <PawPrint className="size-6 text-primary" /> Vetigo
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            {nav.map(([label, href]) => (
              <a key={href} href={href} className="transition-colors hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <a href="#pricing">Start free trial</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <Badge variant="secondary" className="mb-5">
                30-day free trial — no credit card
              </Badge>

              <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
                Vetigo —Veterinary Practice Management Software Built for  Teams
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Scheduling, medical records, vaccinations, inventory and billing — one cloud
                platform per clinic, priced by practice size instead of patient count.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <a href="#pricing">
                    Start free trial <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 text-sm">
                <div>
                  <dt className="text-muted-foreground">Plans from</dt>
                  <dd className="font-display text-xl font-semibold">$99/mo</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Free trial</dt>
                  <dd className="font-display text-xl font-semibold">30 days</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Patient limits</dt>
                  <dd className="font-display text-xl font-semibold">None</dd>
                </div>
              </dl>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <img
                src={heroImage.url}
                alt="Veterinarian examining a corgi with a stethoscope in a modern clinic"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Most clinics are live within a week — without pausing appointments or losing history.
            </p>
            <div className="mt-10 grid items-center gap-10 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <img
                  src={howItWorksImage.url}
                  alt="Veterinarian examining a border collie with the owner in a modern clinic"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {steps.map((s) => (
                  <div key={s.title} className="surface-panel p-6">
                    <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <s.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-medium">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Pricing that scales with your practice
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`surface-panel flex flex-col p-6 ${
                    p.highlight ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                    {p.highlight && <Badge>Most popular</Badge>}
                  </div>
                  <p className="mt-4 font-display text-3xl font-semibold tracking-tight">
                    {p.price}
                    <span className="text-sm font-normal text-muted-foreground"> /month</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.best}</p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={p.highlight ? "default" : "outline"}
                    asChild
                  >
                    <a href={p.name === "Enterprise" ? "#contact" : "/auth"}>
                      {p.name === "Enterprise" ? "Talk to sales" : "Start 30-day trial"}
                    </a>
                  </Button>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Testimonials */}
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Trusted by growing veterinary teams
            </h2>
            <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <img
                  src={testimonialImage.url}
                  alt="Veterinarian examining a dog with a stethoscope in a bright modern clinic"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="grid content-start gap-5">
                {testimonials.map((t) => (
                  <figure key={t.name} className="surface-panel flex flex-col p-6">
                    <Quote className="size-6 text-primary" />
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed">{t.quote}</blockquote>
                    <figcaption className="mt-5 text-sm">
                      <span className="font-medium">{t.name}</span>
                      <span className="block text-muted-foreground">{t.role}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-b border-border">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {faqs.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-4xl px-5 py-20 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Start your 30-day free trial
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
              Full functionality, demo data, import wizard and email support. No credit card
              required, cancel any time.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">Create your clinic workspace</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <a href="mailto:support@ordex-systems.com">Talk to sales</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="flex items-center gap-2 font-display font-semibold">
              <PawPrint className="size-5 text-primary" /> Vetigo
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Veterinary practice management by Ordex Systems.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <a
              href="mailto:support@ordex-systems.com"
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Mail className="size-4" /> support@ordex-systems.com
            </a>
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-5 pb-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ordex Systems. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
