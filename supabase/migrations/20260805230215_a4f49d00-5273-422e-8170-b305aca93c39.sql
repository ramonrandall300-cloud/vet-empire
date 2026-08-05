ALTER TABLE public.clinics DROP CONSTRAINT clinics_owner_id_fkey;
ALTER TABLE public.clinics ADD CONSTRAINT clinics_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;