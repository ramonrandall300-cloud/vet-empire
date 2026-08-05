INSERT INTO public.platform_admins (user_id, role)
SELECT id, 'platform_admin' FROM auth.users WHERE email = 'ramonrandall1000@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.plans SET is_active = false;

INSERT INTO public.plans (slug, name, price_monthly, price_yearly, max_pets, max_staff, sort_order, is_active, features)
VALUES
('starter','Starter',99,1010.80,999999,3,1,true,'["1 location","Up to 3 users","Unlimited pets & clients","Scheduling","Medical records","Vaccinations","Billing & invoices","Basic reporting","Email reminders","Cloud backups"]'::jsonb),
('professional','Professional',249,2539.80,999999,10,2,true,'["Everything in Starter","Up to 10 users","Inventory management","Pharmacy","Laboratory integrations","X-ray/document storage","SMS reminders","Client portal","Online appointment booking","Digital forms","Role-based permissions"]'::jsonb),
('growth','Growth',499,5089.80,999999,999999,3,true,'["Everything in Professional","Unlimited users","Advanced analytics","Financial dashboards","API access","Multi-location (up to 5)","Telemedicine","Custom forms & workflows","Audit logs","Priority support"]'::jsonb),
('enterprise','Enterprise',999,10189.80,999999,999999,4,true,'["Everything in Growth","Unlimited locations","Single Sign-On (SSO)","Custom integrations","Dedicated account manager","SLA","White labeling","Data migration","Advanced security controls","Custom reporting","HIPAA-ready infrastructure","Training"]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_pets = EXCLUDED.max_pets,
  max_staff = EXCLUDED.max_staff,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  features = EXCLUDED.features;