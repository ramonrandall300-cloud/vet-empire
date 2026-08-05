import Stripe from "stripe";

/** Worker-compatible Stripe client. Must be created inside a handler (env is per-request). */
export function getStripe(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, {
    apiVersion: "2026-07-29.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function getWebhookSecret(): string {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return secret;
}

export type PlanRow = {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  stripe_product_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
};

/**
 * Creates (or reuses) a Stripe product + monthly/yearly prices for a plan and
 * returns the identifiers that should be stored on the plan row.
 */
export async function ensurePlanInStripe(stripe: Stripe, plan: PlanRow) {
  let productId = plan.stripe_product_id;

  if (productId) {
    try {
      const existing = await stripe.products.retrieve(productId);
      if (existing.deleted) productId = null;
    } catch {
      productId = null;
    }
  }

  if (!productId) {
    const product = await stripe.products.create({
      name: `Vetigo ${plan.name}`,
      description: `Vetigo ${plan.name} plan for veterinary clinics`,
      metadata: { plan_slug: plan.slug, plan_id: plan.id },
    });
    productId = product.id;
  }

  const priceFor = async (
    existingId: string | null,
    amount: number,
    interval: "month" | "year",
  ) => {
    const unitAmount = Math.round(Number(amount) * 100);
    if (existingId) {
      try {
        const price = await stripe.prices.retrieve(existingId);
        if (
          price.active &&
          price.unit_amount === unitAmount &&
          price.recurring?.interval === interval &&
          price.product === productId
        ) {
          return price.id;
        }
        if (price.active) await stripe.prices.update(price.id, { active: false });
      } catch {
        /* recreate below */
      }
    }
    const created = await stripe.prices.create({
      product: productId!,
      currency: "usd",
      unit_amount: unitAmount,
      recurring: { interval },
      metadata: { plan_slug: plan.slug, plan_id: plan.id },
    });
    return created.id;
  };

  return {
    stripe_product_id: productId,
    stripe_price_id_monthly: await priceFor(plan.stripe_price_id_monthly, plan.price_monthly, "month"),
    stripe_price_id_yearly: await priceFor(plan.stripe_price_id_yearly, plan.price_yearly, "year"),
  };
}
