CREATE INDEX IF NOT EXISTS appointments_pet_id_idx ON public.appointments (pet_id);
CREATE INDEX IF NOT EXISTS appointments_customer_id_idx ON public.appointments (customer_id);
CREATE INDEX IF NOT EXISTS appointments_service_id_idx ON public.appointments (service_id);
CREATE INDEX IF NOT EXISTS appointments_vet_id_idx ON public.appointments (vet_id);

CREATE INDEX IF NOT EXISTS pets_customer_id_idx ON public.pets (customer_id);

CREATE INDEX IF NOT EXISTS examinations_pet_id_idx ON public.examinations (pet_id);
CREATE INDEX IF NOT EXISTS examinations_appointment_id_idx ON public.examinations (appointment_id);
CREATE INDEX IF NOT EXISTS examinations_vet_id_idx ON public.examinations (vet_id);

CREATE INDEX IF NOT EXISTS vaccinations_pet_id_idx ON public.vaccinations (pet_id);
CREATE INDEX IF NOT EXISTS vaccinations_vet_id_idx ON public.vaccinations (vet_id);

CREATE INDEX IF NOT EXISTS invoices_customer_id_idx ON public.invoices (customer_id);
CREATE INDEX IF NOT EXISTS invoices_pet_id_idx ON public.invoices (pet_id);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON public.invoice_items (invoice_id);

CREATE INDEX IF NOT EXISTS clinic_subscriptions_clinic_id_idx ON public.clinic_subscriptions (clinic_id);
CREATE INDEX IF NOT EXISTS clinic_subscriptions_plan_id_idx ON public.clinic_subscriptions (plan_id);

CREATE INDEX IF NOT EXISTS clinics_owner_id_idx ON public.clinics (owner_id);
CREATE INDEX IF NOT EXISTS clinics_plan_id_idx ON public.clinics (plan_id);

CREATE INDEX IF NOT EXISTS customers_email_idx ON public.customers (email) WHERE email IS NOT NULL;