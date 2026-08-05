-- Personal avatars: avatars/users/<uid>/...
CREATE POLICY "Users manage own avatar" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Clinic logos: avatars/clinics/<clinic_id>/...
CREATE POLICY "Clinic members read clinic logo" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'clinics'
  AND public.is_clinic_member(((storage.foldername(name))[2])::uuid, auth.uid())
);

CREATE POLICY "Clinic admins write clinic logo" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'clinics'
  AND public.is_clinic_admin(((storage.foldername(name))[2])::uuid, auth.uid())
);

CREATE POLICY "Clinic admins update clinic logo" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'clinics'
  AND public.is_clinic_admin(((storage.foldername(name))[2])::uuid, auth.uid())
);

CREATE POLICY "Clinic admins delete clinic logo" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'clinics'
  AND public.is_clinic_admin(((storage.foldername(name))[2])::uuid, auth.uid())
);