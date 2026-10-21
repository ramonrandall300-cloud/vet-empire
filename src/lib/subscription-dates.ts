/** A trial period ends when the trial ends, not after the first paid month. */
export function trialPeriodEnd(trialEndsAt: string): string {
  return trialEndsAt;
}

/** Trial dates belong to the clinic; paid renewal dates belong to billing. */
export function subscriptionDate(
  clinic: { subscription_status: string; trial_ends_at: string } | null,
  subscription: { current_period_end: string; cancel_at_period_end: boolean } | null | undefined,
) {
  if (clinic?.subscription_status === "trialing") {
    return { label: "Trial ends", date: clinic.trial_ends_at };
  }
  return {
    label: subscription?.cancel_at_period_end ? "Subscription ends" : "Renewal date",
    date: subscription?.current_period_end ?? null,
  };
}