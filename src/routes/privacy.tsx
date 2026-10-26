import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Vetigo by Ordex Systems" },
      {
        name: "description",
        content:
          "How Vetigo collects, uses, stores and protects clinic, staff and pet-owner information, and how to exercise your privacy rights.",
      },
      { property: "og:title", content: "Privacy Policy — Vetigo" },
      {
        property: "og:description",
        content: "How Vetigo handles clinic, staff and pet-owner data.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to home
      </Link>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page is maintained by Ordex Systems to answer common privacy and security questions
        about Vetigo. It describes our current practices and is not an independent certification or
        audit report. Questions:{" "}
        <a className="text-primary" href="mailto:info@vetigo.pet">
          info@vetigo.pet
        </a>
        .
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Information we handle
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Account data for clinic staff: name, email, phone and role.</li>
            <li>
              Clinic records your team enters: clients, pets, appointments, examinations,
              vaccinations, inventory and invoices.
            </li>
            <li>Billing details for the subscription, handled by our payment processor.</li>
            <li>Operational logs needed to run, secure and support the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Roles</h2>
          <p className="mt-2 text-muted-foreground">
            Your clinic is the controller of the client and patient records it enters; Ordex Systems
            processes that data on your instructions to provide Vetigo. Pet owners should direct
            requests about their records to the clinic that holds them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">How we use data</h2>
          <p className="mt-2 text-muted-foreground">
            To provide the platform, authenticate users, send the reminders and notifications your
            clinic configures, deliver support, bill subscriptions, and detect abuse or security
            issues. We do not sell personal data, and we do not use your clinical records for
            advertising.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Separation and access control
          </h2>
          <p className="mt-2 text-muted-foreground">
            Each clinic&apos;s data is isolated with database row-level security, so users only reach
            records for clinics they belong to. Access inside Vetigo is governed by roles (owner,
            admin, veterinarian, staff). Our staff access production data only when needed to
            provide support or resolve an incident.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Service providers</h2>
          <p className="mt-2 text-muted-foreground">
            We use vetted providers for cloud hosting and database infrastructure, authentication,
            email delivery and payment processing. These providers may process data only to deliver
            their part of the service. A current subprocessor list is available on request.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Retention and deletion
          </h2>
          <p className="mt-2 text-muted-foreground">
            Clinic records are kept while your subscription is active so you can meet professional
            record-keeping requirements. After cancellation you can request an export, after which
            data is scheduled for deletion. Backups age out on their normal rotation.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Cookies</h2>
          <p className="mt-2 text-muted-foreground">
            We use only the storage needed to keep you signed in and remember your active clinic. No
            advertising trackers are used.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Your requests</h2>
          <p className="mt-2 text-muted-foreground">
            Clinic account owners can request access, correction, export or deletion of their data,
            or a data processing agreement, by emailing{" "}
            <a className="text-primary" href="mailto:info@vetigo.pet">
              info@vetigo.pet
            </a>
            . Report suspected security issues to the same address and we will acknowledge promptly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Changes</h2>
          <p className="mt-2 text-muted-foreground">
            We will notify clinic account owners by email before material changes to this policy take
            effect.
          </p>
        </section>
      </div>
    </main>
  );
}
