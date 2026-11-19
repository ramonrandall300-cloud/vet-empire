import { describe, expect, it } from "vitest";
import { checkoutPriceId } from "./billing-catalog";

const syncedPlan = {
  name: "Professional",
  stripe_price_id_monthly: "price_professional_monthly",
  stripe_price_id_yearly: "price_professional_yearly",
};

describe("checkoutPriceId", () => {
  it("uses the existing monthly Stripe price without changing the shared catalog", () => {
    expect(checkoutPriceId(syncedPlan, "monthly")).toBe("price_professional_monthly");
  });

  it("uses the existing yearly Stripe price without changing the shared catalog", () => {
    expect(checkoutPriceId(syncedPlan, "yearly")).toBe("price_professional_yearly");
  });

  it("refuses checkout instead of creating a catalog price when none was synced", () => {
    expect(() =>
      checkoutPriceId(
        {
          name: "Starter",
          stripe_price_id_monthly: null,
          stripe_price_id_yearly: null,
        },
        "monthly",
      ),
    ).toThrow("Starter is not ready for checkout yet. Please contact Vetigo support.");
  });
});
