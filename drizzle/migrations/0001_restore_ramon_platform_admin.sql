INSERT INTO public.platform_admins (user_id, role)
VALUES ('3256f66f-7ebb-47c8-97c0-56f5e2d1556b', 'platform_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'platform_admin';