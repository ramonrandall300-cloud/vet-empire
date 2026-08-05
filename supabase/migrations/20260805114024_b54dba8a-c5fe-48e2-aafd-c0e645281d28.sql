revoke all on function public.is_platform_admin(uuid) from public, anon, authenticated;
revoke all on function public.is_clinic_member(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_clinic_admin(uuid, uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;