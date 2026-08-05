-- Plans: stripe product/price mapping
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id_monthly text,
  ADD COLUMN IF NOT EXISTS stripe_price_id_yearly text;

-- Clinics: stripe customer/subscription mapping
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE UNIQUE INDEX IF NOT EXISTS clinics_stripe_customer_id_key
  ON public.clinics (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Subscriptions: stripe references
ALTER TABLE public.clinic_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS clinic_subscriptions_stripe_sub_key
  ON public.clinic_subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

DROP TRIGGER IF EXISTS clinic_subscriptions_updated ON public.clinic_subscriptions;
CREATE TRIGGER clinic_subscriptions_updated
  BEFORE UPDATE ON public.clinic_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Idempotency log for stripe webhooks
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text NOT NULL UNIQUE,
  type text NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.billing_events TO service_role;
GRANT SELECT ON public.billing_events TO authenticated;

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view billing events" ON public.billing_events;
CREATE POLICY "Platform admins can view billing events"
  ON public.billing_events FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));