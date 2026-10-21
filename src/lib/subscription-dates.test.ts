import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { subscriptionDate, trialPeriodEnd } from "./subscription-dates";

describe("subscription dates", () => {
  test("a November 20 trial does not run through December 20", () => {
    assert.equal(trialPeriodEnd("2026-11-20T17:00:00.000Z"), "2026-11-20T17:00:00.000Z");
  });
  test("a trial uses November 20 even with an old December 20 billing record", () => {
    assert.deepEqual(subscriptionDate(
      { subscription_status: "trialing", trial_ends_at: "2026-11-20T17:00:00.000Z" },
      { current_period_end: "2026-12-20T17:00:00.000Z", cancel_at_period_end: false },
    ), { label: "Trial ends", date: "2026-11-20T17:00:00.000Z" });
  });
  test("active subscriptions keep the billing renewal date", () => {
    assert.deepEqual(subscriptionDate(
      { subscription_status: "active", trial_ends_at: "2026-11-20T17:00:00.000Z" },
      { current_period_end: "2026-12-20T17:00:00.000Z", cancel_at_period_end: false },
    ), { label: "Renewal date", date: "2026-12-20T17:00:00.000Z" });
  });
});