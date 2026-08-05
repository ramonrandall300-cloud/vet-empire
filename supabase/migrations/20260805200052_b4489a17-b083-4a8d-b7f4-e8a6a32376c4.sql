-- 1. clinic_websites: anon read-only on non-sensitive marketing columns
REVOKE ALL ON public.clinic_websites FROM anon;
GRANT SELECT (id, clinic_id, is_published, headline, tagline, about, hero_image_url, primary_color, social_links, updated_at)
  ON public.clinic_websites TO anon;
DROP POLICY IF EXISTS "published websites public" ON public.clinic_websites;
CREATE POLICY "published websites public" ON public.clinic_websites
  FOR SELECT TO anon USING (is_published);

-- 2. plans: anon read-only, no Stripe identifiers
REVOKE ALL ON public.plans FROM anon;
GRANT SELECT (id, name, slug, price_monthly, price_yearly, max_staff, max_pets, max_locations, features, capabilities, trial_days, sort_order, is_active, created_at)
  ON public.plans TO anon;
DROP POLICY IF EXISTS "plans readable" ON public.plans;
CREATE POLICY "plans public read active" ON public.plans
  FOR SELECT TO anon USING (is_active);
CREATE POLICY "plans authenticated read" ON public.plans
  FOR SELECT TO authenticated USING (true);

-- 3. SECURITY DEFINER functions: not callable by anonymous visitors
REVOKE ALL ON FUNCTION public.clinic_plan_limits(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.clinic_has_capability(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_clinic_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_clinic_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clinic_plan_limits(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.clinic_has_capability(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_clinic_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_clinic_admin(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, service_role;

-- 4. Role-check helpers only report on the caller (or when caller is platform admin)
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.platform_admins
    where user_id = _user_id
      and (_user_id = auth.uid()
           or exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid()))
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_clinic_member(_clinic_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select case
    when _user_id is distinct from auth.uid()
         and not exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid())
      then false
    else exists (
      select 1 from public.clinic_members
      where clinic_id = _clinic_id and user_id = _user_id and is_active
    ) or public.is_platform_admin(_user_id)
  end;
$function$;

CREATE OR REPLACE FUNCTION public.is_clinic_admin(_clinic_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select case
    when _user_id is distinct from auth.uid()
         and not exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid())
      then false
    else exists (
      select 1 from public.clinic_members
      where clinic_id = _clinic_id and user_id = _user_id and is_active
        and role in ('owner','admin')
    ) or public.is_platform_admin(_user_id)
  end;
$function$;

-- 5. Plan-limit helpers restricted to members of the clinic
CREATE OR REPLACE FUNCTION public.clinic_plan_limits(_clinic_id uuid)
RETURNS TABLE(plan_id uuid, plan_slug text, max_staff integer, max_pets integer, max_locations integer, capabilities jsonb)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    SELECT p.id, p.slug, p.max_staff, p.max_pets, p.max_locations, p.capabilities
    FROM public.clinics c
    LEFT JOIN public.plans p ON p.id = c.plan_id
    WHERE c.id = _clinic_id
    UNION ALL
    SELECT p.id, p.slug, p.max_staff, p.max_pets, p.max_locations, p.capabilities
    FROM public.plans p
    WHERE p.slug = 'starter'
      AND NOT EXISTS (
        SELECT 1 FROM public.clinics c2
        WHERE c2.id = _clinic_id AND c2.plan_id IS NOT NULL
      )
    LIMIT 1
  ) t
  WHERE auth.uid() IS NULL IS FALSE
    AND (
      EXISTS (
        SELECT 1 FROM public.clinic_members m
        WHERE m.clinic_id = _clinic_id AND m.user_id = auth.uid() AND m.is_active
      )
      OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
    );
$function$;
