DROP POLICY IF EXISTS "clinics read" ON public.clinics;
CREATE POLICY "clinics read"
ON public.clinics
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_clinic_member(id, auth.uid())
  OR public.is_platform_admin(auth.uid())
);