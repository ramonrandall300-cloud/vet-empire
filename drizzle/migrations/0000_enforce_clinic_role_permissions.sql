CREATE OR REPLACE FUNCTION public.has_clinic_role(_clinic_id uuid, _roles public.clinic_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clinic_members
    WHERE clinic_id = _clinic_id
      AND user_id = auth.uid()
      AND is_active
      AND role = ANY(_roles)
  ) OR public.is_platform_admin(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.has_clinic_role(uuid, public.clinic_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_clinic_role(uuid, public.clinic_role[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_clinic_owner(_clinic_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS DISTINCT FROM auth.uid()
         AND NOT public.is_platform_admin(auth.uid()) THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.clinic_members
      WHERE clinic_id = _clinic_id
        AND user_id = _user_id
        AND is_active
        AND role = 'owner'
    ) OR public.is_platform_admin(_user_id)
  END;
$$;

REVOKE ALL ON FUNCTION public.is_clinic_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_clinic_owner(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "examinations member access" ON public.examinations;
CREATE POLICY "examinations clinical access" ON public.examinations
FOR ALL TO authenticated
USING (public.has_clinic_role(clinic_id, ARRAY['owner','admin','veterinarian']::public.clinic_role[]))
WITH CHECK (public.has_clinic_role(clinic_id, ARRAY['owner','admin','veterinarian']::public.clinic_role[]));

DROP POLICY IF EXISTS "vaccinations member access" ON public.vaccinations;
CREATE POLICY "vaccinations clinical access" ON public.vaccinations
FOR ALL TO authenticated
USING (public.has_clinic_role(clinic_id, ARRAY['owner','admin','veterinarian']::public.clinic_role[]))
WITH CHECK (public.has_clinic_role(clinic_id, ARRAY['owner','admin','veterinarian']::public.clinic_role[]));

DROP POLICY IF EXISTS "services member access" ON public.services;
CREATE POLICY "services member read" ON public.services
FOR SELECT TO authenticated USING (public.is_clinic_member(clinic_id, auth.uid()));
CREATE POLICY "services admin insert" ON public.services
FOR INSERT TO authenticated
WITH CHECK (public.has_clinic_role(clinic_id, ARRAY['owner','admin']::public.clinic_role[]));
CREATE POLICY "services admin update" ON public.services
FOR UPDATE TO authenticated
USING (public.has_clinic_role(clinic_id, ARRAY['owner','admin']::public.clinic_role[]))
WITH CHECK (public.has_clinic_role(clinic_id, ARRAY['owner','admin']::public.clinic_role[]));
CREATE POLICY "services admin delete" ON public.services
FOR DELETE TO authenticated
USING (public.has_clinic_role(clinic_id, ARRAY['owner','admin']::public.clinic_role[]));

DROP POLICY IF EXISTS "invoices member access" ON public.invoices;
CREATE POLICY "invoices financial access" ON public.invoices
FOR ALL TO authenticated
USING (public.has_clinic_role(clinic_id, ARRAY['owner','admin','staff']::public.clinic_role[]))
WITH CHECK (public.has_clinic_role(clinic_id, ARRAY['owner','admin','staff']::public.clinic_role[]));

DROP POLICY IF EXISTS "invoice items member access" ON public.invoice_items;
CREATE POLICY "invoice items financial access" ON public.invoice_items
FOR ALL TO authenticated
USING (public.has_clinic_role(clinic_id, ARRAY['owner','admin','staff']::public.clinic_role[]))
WITH CHECK (public.has_clinic_role(clinic_id, ARRAY['owner','admin','staff']::public.clinic_role[]));

DROP POLICY IF EXISTS "websites member access" ON public.clinic_websites;
CREATE POLICY "websites member read" ON public.clinic_websites
FOR SELECT TO authenticated USING (public.is_clinic_member(clinic_id, auth.uid()));
CREATE POLICY "websites admin insert" ON public.clinic_websites
FOR INSERT TO authenticated
WITH CHECK (public.has_clinic_role(clinic_id, ARRAY['owner','admin']::public.clinic_role[]));
CREATE POLICY "websites admin update" ON public.clinic_websites
FOR UPDATE TO authenticated
USING (public.has_clinic_role(clinic_id, ARRAY['owner','admin']::public.clinic_role[]))
WITH CHECK (public.has_clinic_role(clinic_id, ARRAY['owner','admin']::public.clinic_role[]));
CREATE POLICY "websites admin delete" ON public.clinic_websites
FOR DELETE TO authenticated
USING (public.has_clinic_role(clinic_id, ARRAY['owner','admin']::public.clinic_role[]));

DROP POLICY IF EXISTS "members read" ON public.clinic_members;
CREATE POLICY "members read" ON public.clinic_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_clinic_admin(clinic_id, auth.uid()));

DROP POLICY IF EXISTS "subs read" ON public.clinic_subscriptions;
CREATE POLICY "subs owner read" ON public.clinic_subscriptions
FOR SELECT TO authenticated USING (public.is_clinic_owner(clinic_id, auth.uid()));

DROP POLICY IF EXISTS "subs write" ON public.clinic_subscriptions;
CREATE POLICY "subs owner write" ON public.clinic_subscriptions
FOR ALL TO authenticated
USING (public.is_clinic_owner(clinic_id, auth.uid()))
WITH CHECK (public.is_clinic_owner(clinic_id, auth.uid()));