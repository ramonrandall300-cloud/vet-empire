REVOKE SELECT ON public.clinic_websites FROM anon;
GRANT SELECT (id, clinic_id, is_published, headline, tagline, about, hero_image_url, primary_color, social_links, updated_at) ON public.clinic_websites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_websites TO authenticated;
GRANT ALL ON public.clinic_websites TO service_role;