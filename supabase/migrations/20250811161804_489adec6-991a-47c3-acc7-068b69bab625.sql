-- 1) Roles: enum, table, function, and updates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper: has_role function
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

-- Migrate existing admins from profiles.role = 'admin'
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::public.app_role
FROM public.profiles p
WHERE p.role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Update is_admin to use has_role
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(user_id, 'admin'::public.app_role);
$$;

-- Function to safely fetch current profile role (to avoid recursion in policies)
CREATE OR REPLACE FUNCTION public.get_profile_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id;
$$;

-- 2) Lock down Profiles: prevent self-promotion via role edits
DO $$ BEGIN
  -- Drop existing user update policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Usuários podem atualizar seu próprio perfil'
  ) THEN
    DROP POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles;
  END IF;
END $$;

-- Recreate safer update policies
CREATE POLICY "Users update own profile (no role change)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = public.get_profile_role(user_id));

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Optional: ensure inserts by users cannot set admin role
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Usuários podem criar seu próprio perfil'
  ) THEN
    DROP POLICY "Usuários podem criar seu próprio perfil" ON public.profiles;
  END IF;
END $$;

CREATE POLICY "Users can insert own profile (role=user only)"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id AND COALESCE(role, 'user') = 'user');

-- 3) Tighten sensitive tables: remove overly-permissive INSERT/SELECT policies
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Sistema pode criar notificações'
  ) THEN
    DROP POLICY "Sistema pode criar notificações" ON public.notifications;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_feed' AND policyname = 'Sistema pode criar atividades'
  ) THEN
    DROP POLICY "Sistema pode criar atividades" ON public.activity_feed;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_achievements' AND policyname = 'Sistema pode criar conquistas para usuários'
  ) THEN
    DROP POLICY "Sistema pode criar conquistas para usuários" ON public.user_achievements;
  END IF;
END $$;

-- Lock down push_subscriptions broad select
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'push_subscriptions' AND policyname = 'Sistema pode acessar subscrições para notificações'
  ) THEN
    DROP POLICY "Sistema pode acessar subscrições para notificações" ON public.push_subscriptions;
  END IF;
END $$;

-- 4) Update custom_exercises admin policies to use has_role
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'custom_exercises' AND policyname = 'Apenas admins podem criar exercícios'
  ) THEN
    DROP POLICY "Apenas admins podem criar exercícios" ON public.custom_exercises;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'custom_exercises' AND policyname = 'Apenas admins podem atualizar exercícios'
  ) THEN
    DROP POLICY "Apenas admins podem atualizar exercícios" ON public.custom_exercises;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'custom_exercises' AND policyname = 'Apenas admins podem deletar exercícios'
  ) THEN
    DROP POLICY "Apenas admins podem deletar exercícios" ON public.custom_exercises;
  END IF;
END $$;

CREATE POLICY "Admins can create exercises"
ON public.custom_exercises
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update exercises"
ON public.custom_exercises
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete exercises"
ON public.custom_exercises
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5) Storage policies: avatars (owner write), exercise-images (admin write), public read
-- Avatars
CREATE POLICY IF NOT EXISTS "Avatar public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Users can upload own avatar"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update own avatar"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete own avatar"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Exercise images
CREATE POLICY IF NOT EXISTS "Exercise images public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'exercise-images');

CREATE POLICY IF NOT EXISTS "Admins can manage exercise images"
ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'exercise-images' AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'exercise-images' AND public.has_role(auth.uid(), 'admin')
);
