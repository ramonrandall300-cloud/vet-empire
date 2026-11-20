import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ClinicRole } from "@/lib/clinic-context";

const ROLES: ClinicRole[] = ["owner", "admin", "veterinarian", "staff"];

/** Add an existing account to a clinic without exposing arbitrary profile lookups. */
export const addClinicMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { clinicId: string; email: string; role: ClinicRole }) => {
    if (!data?.clinicId) throw new Error("clinicId is required");
    const email = data.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      throw new Error("Enter a valid email address");
    }
    if (!ROLES.includes(data.role)) throw new Error("Invalid clinic role");
    return { clinicId: data.clinicId, email, role: data.role };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_clinic_admin", {
      _clinic_id: data.clinicId,
      _user_id: context.userId,
    });
    if (roleError) throw new Error("Could not verify permissions");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .eq("is_active", true)
      .maybeSingle();
    if (profileError) throw new Error("Could not look up that account");
    if (!profile) {
      throw new Error(
        "No Vetigo account uses that email yet. Ask them to sign up first, then add them here.",
      );
    }

    // Insert as the verified clinic admin so RLS and the plan's staff-seat
    // limit trigger still apply; only the profile email lookup is privileged.
    const { data: member, error: insertError } = await context.supabase
      .from("clinic_members")
      .insert({ clinic_id: data.clinicId, user_id: profile.id, role: data.role })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    return { memberId: member.id };
  });
