import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

type SubStatus = "trialing" | "active" | "past_due" | "canceled";

function mapStatus(status: Stripe.Subscription.Status): SubStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    default:
      return "canceled";
  }
}

export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const body = await request.text();
        const { getStripe, constructWebhookEvent } = await import("@/lib/stripe.server");
        const stripe = getStripe();

        let event: Stripe.Event;
        try {
          event = await constructWebhookEvent(body, signature);
        } catch {
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: skip events we have already handled.
        const { error: logError } = await supabaseAdmin
          .from("billing_events")
          .insert({
            stripe_event_id: event.id,
            type: event.type,
            payload: JSON.parse(body) as Record<string, never>,
          });
        if (logError) {
          if (logError.code === "23505") return new Response("ok (duplicate)");
          console.error("billing_events insert failed", logError.message);
        }

        const finish = async (clinicId: string | null, error?: string) => {
          await supabaseAdmin
            .from("billing_events")
            .update({ processed_at: new Date().toISOString(), clinic_id: clinicId, error: error ?? null })
            .eq("stripe_event_id", event.id);
        };

        const syncSubscription = async (subscription: Stripe.Subscription) => {
          const customerId =
            typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

          let clinicId = subscription.metadata?.["clinic_id"] ?? null;
          if (!clinicId) {
            const { data: clinic } = await supabaseAdmin
              .from("clinics")
              .select("id")
              .eq("stripe_customer_id", customerId)
              .maybeSingle();
            clinicId = clinic?.id ?? null;
          }
          if (!clinicId) {
            await finish(null, `No clinic matched customer ${customerId}`);
            return;
          }

          const item = subscription.items.data[0];
          const priceId = item?.price?.id ?? null;
          const interval = item?.price?.recurring?.interval === "year" ? "yearly" : "monthly";
          const amount = (item?.price?.unit_amount ?? 0) / 100;

          let planId = subscription.metadata?.["plan_id"] ?? null;
          if (!planId && priceId) {
            const { data: plan } = await supabaseAdmin
              .from("plans")
              .select("id")
              .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
              .maybeSingle();
            planId = plan?.id ?? null;
          }

          const status = mapStatus(subscription.status);
          const periodStart = item?.current_period_start ?? subscription.start_date;
          const periodEnd = item?.current_period_end ?? subscription.start_date;

          await supabaseAdmin
            .from("clinics")
            .update({
              subscription_status: status,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              ...(planId ? { plan_id: planId } : {}),
            })
            .eq("id", clinicId);

          if (planId) {
            await supabaseAdmin.from("clinic_subscriptions").upsert(
              {
                clinic_id: clinicId,
                plan_id: planId,
                status,
                interval,
                amount,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: customerId,
                stripe_price_id: priceId,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_start: new Date(periodStart * 1000).toISOString(),
                current_period_end: new Date(periodEnd * 1000).toISOString(),
              },
              { onConflict: "stripe_subscription_id" },
            );
          }

          await finish(clinicId);
        };

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              if (session.subscription) {
                const subId =
                  typeof session.subscription === "string" ? session.subscription : session.subscription.id;
                await syncSubscription(await stripe.subscriptions.retrieve(subId));
              } else {
                await finish(session.client_reference_id ?? null);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
              await syncSubscription(event.data.object);
              break;
            case "invoice.payment_failed":
            case "invoice.paid": {
              const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
              const subId =
                typeof invoice.subscription === "string" ? invoice.subscription : null;
              if (subId) await syncSubscription(await stripe.subscriptions.retrieve(subId));
              else await finish(null);
              break;
            }
            default:
              await finish(null);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error(`stripe webhook ${event.type} failed`, message);
          await finish(null, message);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
