DROP POLICY "members write" ON public.clinic_members;

CREATE POLICY "members write" ON public.clinic_members
FOR INSERT TO authenticated
WITH CHECK (
  public.is_clinic_admin(clinic_id, auth.uid())
  OR (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.clinics c
      WHERE c.id = clinic_members.clinic_id
        AND c.owner_id = auth.uid()
    )
  )
);