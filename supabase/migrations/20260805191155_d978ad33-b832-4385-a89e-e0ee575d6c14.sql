-- 1. Extend plans with limits + machine-readable capabilities
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS max_locations integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS capabilities jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.plans SET max_locations = 1, trial_days = 30, capabilities = '["scheduling","medical_records","vaccinations","invoicing","basic_reporting","email_reminders","cloud_backups"]'::jsonb WHERE slug = 'starter';

UPDATE public.plans SET max_locations = 1, trial_days = 30, capabilities = '["scheduling","medical_records","vaccinations","invoicing","basic_reporting","email_reminders","cloud_backups","inventory","pharmacy","lab_integrations","document_storage","sms_reminders","client_portal","online_booking","digital_forms","role_permissions"]'::jsonb WHERE slug = 'professional';

UPDATE public.plans SET max_locations = 5, trial_days = 30, capabilities = '["scheduling","medical_records","vaccinations","invoicing","basic_reporting","email_reminders","cloud_backups","inventory","pharmacy","lab_integrations","document_storage","sms_reminders","client_portal","online_booking","digital_forms","role_permissions","advanced_analytics","financial_dashboards","api_access","multi_location","telemedicine","custom_workflows","audit_logs","priority_support"]'::jsonb WHERE slug = 'growth';

UPDATE public.plans SET max_locations = 999999, trial_days = 30, capabilities = '["scheduling","medical_records","vaccinations","invoicing","basic_reporting","email_reminders","cloud_backups","inventory","pharmacy","lab_integrations","document_storage","sms_reminders","client_portal","online_booking","digital_forms","role_permissions","advanced_analytics","financial_dashboards","api_access","multi_location","telemedicine","custom_workflows","audit_logs","priority_support","sso","custom_integrations","dedicated_account_manager","sla","white_labeling","data_migration","advanced_security","custom_reporting","hipaa_infrastructure","training"]'::jsonb WHERE slug = 'enterprise';

-- 2. Effective limits for a clinic (falls back to the Starter tier during trial with no plan)
CREATE OR REPLACE FUNCTION public.clinic_plan_limits(_clinic_id uuid)
RETURNS TABLE (plan_id uuid, plan_slug text, max_staff integer, max_pets integer, max_locations integer, capabilities jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  LIMIT 1;
$$;

-- 3. Capability check
CREATE OR REPLACE FUNCTION public.clinic_has_capability(_clinic_id uuid, _capability text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT l.capabilities ? _capability FROM public.clinic_plan_limits(_clinic_id) l),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.clinic_plan_limits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clinic_has_capability(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.clinic_plan_limits(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.clinic_has_capability(uuid, text) FROM anon;

-- 4. Enforce staff seat limits
CREATE OR REPLACE FUNCTION public.enforce_staff_seat_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seat_limit integer;
  used integer;
BEGIN
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;

  SELECT l.max_staff INTO seat_limit FROM public.clinic_plan_limits(NEW.clinic_id) l;
  IF seat_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO used
  FROM public.clinic_members m
  WHERE m.clinic_id = NEW.clinic_id
    AND m.is_active
    AND m.id <> NEW.id;

  IF used >= seat_limit THEN
    RAISE EXCEPTION 'Staff seat limit reached for this clinic''s plan (% seats). Upgrade the plan to add more users.', seat_limit;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clinic_members_seat_limit ON public.clinic_members;
CREATE TRIGGER clinic_members_seat_limit
  BEFORE INSERT OR UPDATE OF is_active ON public.clinic_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_staff_seat_limit();
