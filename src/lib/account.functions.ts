import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Cancel (or resume) a clinic's Stripe subscription at period end. Clinic admins only. */
export const setSubscriptionCancellation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { clinicId: string; cancel: boolean }) => {
    if (!data?.clinicId) throw new Error("clinicId is required");
    if (typeof data.cancel !== "boolean") throw new Error("cancel must be a boolean");
    return data;
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
      .select("stripe_subscription_id")
      .eq("id", data.clinicId)
      .single();
    if (!clinic?.stripe_subscription_id) throw new Error("This clinic has no active subscription");

    const subscription = await getStripe().subscriptions.update(clinic.stripe_subscription_id, {
      cancel_at_period_end: data.cancel,
    });

    await supabaseAdmin
      .from("clinic_subscriptions")
      .update({ cancel_at_period_end: data.cancel })
      .eq("stripe_subscription_id", subscription.id);

    return { cancelAtPeriodEnd: subscription.cancel_at_period_end };
  });

/** Permanently delete the signed-in user's own account. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("clinic_members").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("profiles").update({ is_active: false }).eq("id", context.userId);


    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);

    return { deleted: true };
  });
