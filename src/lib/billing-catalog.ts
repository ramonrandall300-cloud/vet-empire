export type CheckoutCatalogPlan = {
  name: string;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
};

/**
 * Checkout is read-only for clinic admins: it may only use a Stripe price that
 * a platform admin has already synced into the shared plan catalog.
 */
export function checkoutPriceId(
  plan: CheckoutCatalogPlan,
  interval: "monthly" | "yearly",
): string {
  const priceId =
    interval === "yearly" ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;

  if (!priceId) {
    throw new Error(
      `${plan.name} is not ready for checkout yet. Please contact Vetigo support.`,
    );
  }

  return priceId;
}
