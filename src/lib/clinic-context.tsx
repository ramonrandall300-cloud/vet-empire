import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];
export type ClinicRole = Database["public"]["Enums"]["clinic_role"];

const STORAGE_KEY = "vetigo.activeClinic";

type Membership = { clinic_id: string; role: ClinicRole; clinics: Clinic | null };

type ClinicContextValue = {
  clinics: Clinic[];
  memberships: Membership[];
  clinic: Clinic | null;
  role: ClinicRole | null;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  loading: boolean;
  setClinicId: (id: string) => void;
  refetch: () => void;
};

const ClinicContext = createContext<ClinicContextValue | null>(null);

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setActiveId(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const membershipQuery = useQuery({
    queryKey: ["memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_members")
        .select("clinic_id, role, clinics(*)")
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []) as unknown as Membership[];
    },
  });

  const platformQuery = useQuery({
    queryKey: ["platform-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("platform_admins").select("user_id");
      return (data?.length ?? 0) > 0;
    },
  });

  const allClinicsQuery = useQuery({
    queryKey: ["all-clinics"],
    enabled: platformQuery.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const memberships = useMemo(() => {
    const own = (membershipQuery.data ?? []).filter((m) => m.clinics);
    if (platformQuery.data !== true) return own;

    const ownedIds = new Set(own.map((m) => m.clinic_id));
    const platformMemberships: Membership[] = (allClinicsQuery.data ?? [])
      .filter((clinic) => !ownedIds.has(clinic.id))
      .map((clinic) => ({ clinic_id: clinic.id, role: "owner", clinics: clinic }));
    return [...own, ...platformMemberships];
  }, [allClinicsQuery.data, membershipQuery.data, platformQuery.data]);
  const clinics = useMemo(() => memberships.map((m) => m.clinics!), [memberships]);

  const current = useMemo(() => {
    if (!memberships.length) return null;
    return memberships.find((m) => m.clinic_id === activeId) ?? memberships[0]!;
  }, [memberships, activeId]);

  const value: ClinicContextValue = {
    clinics,
    memberships,
    clinic: current?.clinics ?? null,
    role: current?.role ?? null,
    isAdmin: current?.role === "owner" || current?.role === "admin" || platformQuery.data === true,
    isPlatformAdmin: platformQuery.data === true,
    loading:
      membershipQuery.isLoading || (platformQuery.data === true && allClinicsQuery.isLoading),
    setClinicId: (id: string) => {
      window.localStorage.setItem(STORAGE_KEY, id);
      setActiveId(id);
    },
    refetch: () => {
      void membershipQuery.refetch();
    },
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used inside ClinicProvider");
  return ctx;
}
