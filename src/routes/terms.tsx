import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — SmartVet by Ordex Systems" },
      {
        name: "description",
        content:
          "The terms that govern use of the SmartVet veterinary practice management platform, including subscriptions, trials, billing and acceptable use.",
      },
      { property: "og:title", content: "Terms of Service — SmartVet" },
      {
        property: "og:description",
        content: "Subscription, trial, billing and acceptable-use terms for SmartVet.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to home
      </Link>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Maintained by Ordex Systems for the SmartVet platform. Contact{" "}
        <a className="text-primary" href="mailto:support@ordex-systems.com">
          support@ordex-systems.com
        </a>{" "}
        with any questions about these terms.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. Agreement</h2>
          <p className="mt-2 text-muted-foreground">
            By creating an account or using SmartVet, your clinic agrees to these terms. If you are
            accepting on behalf of a practice, you confirm you have authority to do so.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            2. Trials and subscriptions
          </h2>
          <p className="mt-2 text-muted-foreground">
            New clinics may use SmartVet free for 30 days with full functionality and no credit card
            required. After the trial, continued use requires a paid plan — Starter, Professional,
            Growth or Enterprise. Plan limits on locations and users apply as published on our
            pricing page.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            3. Billing and changes
          </h2>
          <p className="mt-2 text-muted-foreground">
            Subscriptions are billed monthly or annually in advance; annual billing is discounted
            15%. Add-on modules and usage-based charges (such as SMS or payment processing) are
            billed in the same cycle. Plan upgrades take effect immediately and prorate; downgrades
            take effect at the next renewal. Fees are non-refundable except where required by law.
            One-time services such as data migration and training are quoted separately.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. Your data</h2>
          <p className="mt-2 text-muted-foreground">
            Your clinic retains ownership of the client, patient and clinical records you enter. We
            process that data only to provide and support the service, as described in our{" "}
            <Link className="text-primary" to="/privacy">
              Privacy Policy
            </Link>
            . You are responsible for the accuracy of records and for complying with the
            professional and record-keeping rules that apply to your practice.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">5. Acceptable use</h2>
          <p className="mt-2 text-muted-foreground">
            Do not use SmartVet to store unlawful content, attempt to access another clinic&apos;s
            data, probe or disrupt the service, resell access without a written agreement, or share
            user credentials. Each named user must have their own account.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            6. Clinical responsibility
          </h2>
          <p className="mt-2 text-muted-foreground">
            SmartVet is administrative software. It does not provide veterinary advice, diagnosis or
            treatment decisions. Optional AI features generate draft text that a licensed
            veterinarian must review before it becomes part of the medical record.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            7. Availability and support
          </h2>
          <p className="mt-2 text-muted-foreground">
            We aim to keep the service available continuously and perform maintenance with notice
            where practical. Priority support is included on Growth, and Enterprise agreements may
            include a written service-level agreement. Unless a signed agreement says otherwise, the
            service is provided without an uptime guarantee.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            8. Suspension and termination
          </h2>
          <p className="mt-2 text-muted-foreground">
            You may cancel at any time; access continues to the end of the paid period. We may
            suspend accounts for non-payment or breach of these terms. On termination you can
            request an export of your clinic data before it is deleted.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            9. Liability and changes
          </h2>
          <p className="mt-2 text-muted-foreground">
            To the extent permitted by law, our aggregate liability is limited to the fees you paid
            in the twelve months before the claim. We may update these terms and will notify account
            owners of material changes by email before they take effect.
          </p>
        </section>
      </div>
    </main>
  );
}
