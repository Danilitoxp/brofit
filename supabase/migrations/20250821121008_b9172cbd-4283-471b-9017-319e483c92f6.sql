-- CRITICAL SECURITY FIXES FOR DATA EXPOSURE AND RLS POLICIES

-- 1. Fix profiles table RLS - restrict public access to friends only
DROP POLICY IF EXISTS "Usuários podem ver perfis públicos" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id AND 
  is_public = true AND 
  EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND (
      (requester_id = auth.uid() AND addressee_id = profiles.user_id) OR
      (addressee_id = auth.uid() AND requester_id = profiles.user_id)
    )
  )
);

-- 2. Fix workouts table RLS - remove broad public access
DROP POLICY IF EXISTS "Usuários podem ver treinos próprios e de amigos" ON public.workouts;

CREATE POLICY "Users can view their own workouts" 
ON public.workouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends workouts" 
ON public.workouts 
FOR SELECT 
USING (
  auth.uid() != user_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = workouts.user_id AND p.is_public = true
  ) AND
  EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND (
      (requester_id = auth.uid() AND addressee_id = workouts.user_id) OR
      (addressee_id = auth.uid() AND requester_id = workouts.user_id)
    )
  )
);

-- 3. Fix workout_exercises table RLS - remove broad public access
DROP POLICY IF EXISTS "Usuários podem ver exercícios de treinos próprios e de amigo" ON public.workout_exercises;

CREATE POLICY "Users can view their own workout exercises" 
ON public.workout_exercises 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workouts 
    WHERE workouts.id = workout_exercises.workout_id 
    AND workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view friends workout exercises" 
ON public.workout_exercises 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    JOIN public.profiles p ON p.user_id = w.user_id
    WHERE w.id = workout_exercises.workout_id 
    AND w.user_id != auth.uid()
    AND p.is_public = true
    AND EXISTS (
      SELECT 1 FROM public.friendships 
      WHERE status = 'accepted' 
      AND (
        (requester_id = auth.uid() AND addressee_id = w.user_id) OR
        (addressee_id = auth.uid() AND requester_id = w.user_id)
      )
    )
  )
);

-- 4. Fix workout_stats table RLS - remove broad public access
DROP POLICY IF EXISTS "Usuários podem ver estatísticas de perfis públicos" ON public.workout_stats;

CREATE POLICY "Users can view their own workout stats" 
ON public.workout_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends workout stats" 
ON public.workout_stats 
FOR SELECT 
USING (
  auth.uid() != user_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = workout_stats.user_id AND p.is_public = true
  ) AND
  EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND (
      (requester_id = auth.uid() AND addressee_id = workout_stats.user_id) OR
      (addressee_id = auth.uid() AND requester_id = workout_stats.user_id)
    )
  )
);

-- 5. CRITICAL: Add RLS policies to user_roles table (currently has NONE)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. Fix database functions security - add proper search_path settings
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_profile_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = _user_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(user_id, 'admin'::public.app_role);
$function$;

-- 7. Fix all other database functions with proper search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; 
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, nickname)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.workout_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;