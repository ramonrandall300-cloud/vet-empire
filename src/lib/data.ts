import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinic } from "@/lib/clinic-context";

/** Generic, loosely-typed table access so one component can drive every resource page. */
type AnyRow = Record<string, unknown>;

export function useClinicRows(
  table: string,
  opts: { select?: string; orderBy?: string; ascending?: boolean; enabled?: boolean } = {},
) {
  const { clinic } = useClinic();
  const clinicId = clinic?.id;
  return useQuery({
    queryKey: ["rows", table, clinicId, opts.select ?? "*", opts.orderBy ?? ""],
    enabled: Boolean(clinicId) && opts.enabled !== false,
    queryFn: async () => {
      let q = (supabase.from(table as never) as never as ReturnType<typeof supabase.from>)
        .select(opts.select ?? "*")
        .eq("clinic_id", clinicId!);
      if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as AnyRow[];
    },
  });
}

export function useRowMutations(table: string) {
  const { clinic } = useClinic();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["rows"] });
  const client = () => supabase.from(table as never) as never as ReturnType<typeof supabase.from>;

  return {
    async create(values: AnyRow) {
      const { error } = await client().insert({ ...values, clinic_id: clinic!.id } as never);
      if (error) throw error;
      invalidate();
    },
    async update(id: string, values: AnyRow) {
      const { error } = await client()
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
      invalidate();
    },
    async remove(id: string) {
      const { error } = await client().delete().eq("id", id);
      if (error) throw error;
      invalidate();
    },
  };
}

export function useLookup(table: string, labelColumn = "name") {
  const rows = useClinicRows(table, {
    select: `id, ${labelColumn}`,
    orderBy: labelColumn,
    ascending: true,
  });
  return (rows.data ?? []).map((r) => ({
    value: String(r["id"]),
    label: String(r[labelColumn] ?? "Untitled"),
  }));
}

export function useClinicStaff() {
  const { clinic } = useClinic();
  return useQuery({
    queryKey: ["staff", clinic?.id],
    enabled: Boolean(clinic?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_members")
        .select("user_id, role, profiles:user_id(full_name, email)")
        .eq("clinic_id", clinic!.id);
      if (error) throw error;
      return (data ?? []) as unknown as {
        user_id: string;
        role: string;
        profiles: { full_name: string | null; email: string | null } | null;
      }[];
    },
  });
}
