import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { checkoutPriceId } from "./billing-catalog";

const syncedPlan = {
  name: "Professional",
  stripe_price_id_monthly: "price_professional_monthly",
  stripe_price_id_yearly: "price_professional_yearly",
};

describe("checkoutPriceId", () => {
  test("uses the existing monthly Stripe price without changing the shared catalog", () => {
    assert.equal(checkoutPriceId(syncedPlan, "monthly"), "price_professional_monthly");
  });

  test("uses the existing yearly Stripe price without changing the shared catalog", () => {
    assert.equal(checkoutPriceId(syncedPlan, "yearly"), "price_professional_yearly");
  });

  test("refuses checkout instead of creating a catalog price when none was synced", () => {
    assert.throws(
      () =>
        checkoutPriceId(
          {
            name: "Starter",
            stripe_price_id_monthly: null,
            stripe_price_id_yearly: null,
          },
          "monthly",
        ),
      /Starter is not ready for checkout yet\. Please contact Vetigo support\./,
    );
  });
});
