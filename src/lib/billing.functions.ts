import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_ORIGINS = new Set([
  "https://vetigo.pet",
  "https://www.vetigo.pet",
  "https://vet-empire.lovable.app",
  "https://id-preview--906de6fe-8a09-4504-b296-727f0e866356.lovable.app",
  "http://localhost:8080",
]);
const DEFAULT_ORIGIN = "https://vetigo.pet";

/** Only return users to a known Vetigo origin; anything else falls back to the main site. */
function safeOrigin(origin: unknown): string {
  if (typeof origin !== "string") return DEFAULT_ORIGIN;
  try {
    const o = new URL(origin).origin;
    return ALLOWED_ORIGINS.has(o) ? o : DEFAULT_ORIGIN;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

/** Push all active plans to Stripe as products/prices and store the IDs. Platform admins only. */
export const syncStripeCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_platform_admin", {
      _user_id: context.userId,
    });
    if (roleError) throw new Error("Could not verify permissions");
    if (!isAdmin) throw new Error("Forbidden");

    const { getStripe, ensurePlanInStripe } = await import("./stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = getStripe();

    const { data: plans, error } = await supabaseAdmin
      .from("plans")
      .select(
        "id, name, slug, price_monthly, price_yearly, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly",
      )
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);

    const synced: { plan: string; product: string }[] = [];
    for (const plan of plans ?? []) {
      const ids = await ensurePlanInStripe(stripe, {
        ...plan,
        price_monthly: Number(plan.price_monthly),
        price_yearly: Number(plan.price_yearly),
      });
      const { error: updateError } = await supabaseAdmin
        .from("plans")
        .update(ids)
        .eq("id", plan.id);
      if (updateError) throw new Error(updateError.message);
      synced.push({ plan: plan.name, product: ids.stripe_product_id });
    }

    return { synced, count: synced.length };
  });

/** Start a Stripe Checkout session for a clinic + plan. Clinic admins only. */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { clinicId: string; planId: string; interval: "monthly" | "yearly"; origin: string }) => {
    if (!data?.clinicId || !data?.planId) throw new Error("clinicId and planId are required");
    if (data.interval !== "monthly" && data.interval !== "yearly") throw new Error("Invalid interval");
    return { ...data, origin: safeOrigin(data.origin) };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_clinic_admin", {
      _clinic_id: data.clinicId,
      _user_id: context.userId,
    });
    if (roleError) throw new Error("Could not verify permissions");
    if (!isAdmin) throw new Error("Forbidden");

    const { getStripe, ensurePlanInStripe } = await import("./stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = getStripe();

    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("id, name, email, stripe_customer_id")
      .eq("id", data.clinicId)
      .single();
    if (clinicError || !clinic) throw new Error("Clinic not found");

    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select(
        "id, name, slug, price_monthly, price_yearly, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly",
      )
      .eq("id", data.planId)
      .eq("is_active", true)
      .single();
    if (planError || !plan) throw new Error("Plan not found");

    // Keep checkout self-contained: a new or repriced plan must not require a
    // separate platform-admin catalog sync before a clinic can subscribe.
    const stripeIds = await ensurePlanInStripe(stripe, {
      ...plan,
      price_monthly: Number(plan.price_monthly),
      price_yearly: Number(plan.price_yearly),
    });
    const { error: planUpdateError } = await supabaseAdmin
      .from("plans")
      .update(stripeIds)
      .eq("id", plan.id);
    if (planUpdateError) throw new Error("Could not save the plan's Stripe billing details");

    const priceId =
      data.interval === "yearly" ? stripeIds.stripe_price_id_yearly : stripeIds.stripe_price_id_monthly;

    let customerId = clinic.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: clinic.name,
        ...(clinic.email ? { email: clinic.email } : {}),
        metadata: { clinic_id: clinic.id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from("clinics")
        .update({ stripe_customer_id: customerId })
        .eq("id", clinic.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: clinic.id,
      subscription_data: {
        metadata: { clinic_id: clinic.id, plan_id: plan.id },
      },
      metadata: { clinic_id: clinic.id, plan_id: plan.id },
      success_url: `${data.origin}/app/subscription?checkout=success`,
      cancel_url: `${data.origin}/app/subscription?checkout=cancelled`,
    });

    return { url: session.url };
  });

/** Open the Stripe billing portal for a clinic. Clinic admins only. */
export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { clinicId: string; origin: string }) => {
    if (!data?.clinicId) throw new Error("clinicId is required");
    return { ...data, origin: safeOrigin(data.origin) };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_clinic_admin", {
      _clinic_id: data.clinicId,
      _user_id: context.userId,
    });
    if (roleError) throw new Error("Could not verify permissions");
    if (!isAdmin) throw new Error("Forbidden");

    const { getStripe } = await import("./stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: clinic } = await supabaseAdmin
      .from("clinics")
      .select("stripe_customer_id")
      .eq("id", data.clinicId)
      .single();
    if (!clinic?.stripe_customer_id) throw new Error("This clinic has no Stripe billing profile yet");

    const session = await getStripe().billingPortal.sessions.create({
      customer: clinic.stripe_customer_id,
      return_url: `${data.origin}/app/subscription`,
    });

    return { url: session.url };
  });
