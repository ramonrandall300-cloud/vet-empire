ALTER TABLE public.clinic_members
  ADD CONSTRAINT clinic_members_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.shares_clinic_with(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinic_members a
    JOIN public.clinic_members b ON b.clinic_id = a.clinic_id
    WHERE a.user_id = auth.uid() AND a.is_active
      AND b.user_id = _user_id AND b.is_active
  );
$$;

REVOKE ALL ON FUNCTION public.shares_clinic_with(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_clinic_with(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "profile read" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_platform_admin(auth.uid()) OR public.shares_clinic_with(id));