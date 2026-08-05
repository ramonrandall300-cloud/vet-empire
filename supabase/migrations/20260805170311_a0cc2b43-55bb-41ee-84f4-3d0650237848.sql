REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_clinic_member(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_clinic_admin(uuid, uuid) FROM anon, PUBLIC;