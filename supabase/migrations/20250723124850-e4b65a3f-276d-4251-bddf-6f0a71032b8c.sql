-- Corrigir RLS para visualização de treinos de amigos
-- Primeiro, vamos ajustar a política de workouts para permitir que amigos vejam os treinos
DROP POLICY IF EXISTS "Usuários podem ver seus próprios treinos" ON public.workouts;

CREATE POLICY "Usuários podem ver treinos próprios e de amigos" 
ON public.workouts 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = workouts.user_id 
    AND profiles.is_public = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE ((requester_id = auth.uid() AND addressee_id = workouts.user_id) OR 
           (addressee_id = auth.uid() AND requester_id = workouts.user_id)) 
    AND status = 'accepted'
  )
);

-- Ajustar RLS para workout_exercises também
DROP POLICY IF EXISTS "Usuários podem ver exercícios dos seus treinos" ON public.workout_exercises;

CREATE POLICY "Usuários podem ver exercícios de treinos próprios e de amigos" 
ON public.workout_exercises 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workouts 
    WHERE workouts.id = workout_exercises.workout_id 
    AND (
      workouts.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = workouts.user_id 
        AND profiles.is_public = true
      ) OR
      EXISTS (
        SELECT 1 FROM public.friendships 
        WHERE ((requester_id = auth.uid() AND addressee_id = workouts.user_id) OR 
               (addressee_id = auth.uid() AND requester_id = workouts.user_id)) 
        AND status = 'accepted'
      )
    )
  )
);