-- Security hardening migration (fixed EXECUTE quoting)
-- 1) Ensure app_role enum exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
  END IF;
END $$;

-- 2) user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(user_id, 'admin'::public.app_role);
$$;

CREATE OR REPLACE FUNCTION public.get_profile_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id;
$$;

-- 4) Migrate admin roles from profiles table (if any)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::public.app_role
FROM public.profiles p
WHERE p.role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- 5) Recreate safe profile policies
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can update any profile'
  ) THEN
    DROP POLICY "Admins can update any profile" ON public.profiles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users update own profile (no role change)'
  ) THEN
    DROP POLICY "Users update own profile (no role change)" ON public.profiles;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert own profile (role=user only)'
  ) THEN
    DROP POLICY "Users can insert own profile (role=user only)" ON public.profiles;
  END IF;
END $$;

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own profile (no role change)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = public.get_profile_role(user_id));

CREATE POLICY "Users can insert own profile (role=user only)"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id AND COALESCE(role, 'user') = 'user');

-- 6) Storage policies (create if missing) using dynamic SQL wrappers with proper quoting
-- Avatars: public read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Avatar public read'
  ) THEN
    EXECUTE 'CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT USING (bucket_id = ''avatars'')';
  END IF;
END $$;

-- Users can upload own avatar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload own avatar'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

-- Users can update own avatar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update own avatar'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

-- Users can delete own avatar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own avatar'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

-- Exercise images: public read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Exercise images public read'
  ) THEN
    EXECUTE 'CREATE POLICY "Exercise images public read" ON storage.objects FOR SELECT USING (bucket_id = ''exercise-images'')';
  END IF;
END $$;

-- Admins can manage exercise images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can manage exercise images'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage exercise images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = ''exercise-images'' AND public.has_role(auth.uid(), ''admin'')) WITH CHECK (bucket_id = ''exercise-images'' AND public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;