-- Criar tabela de treinos
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER, -- 0=domingo, 1=segunda, 2=terça, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de exercícios dos treinos
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 12,
  weight DECIMAL(5,2) DEFAULT 0,
  exercise_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para workouts
CREATE POLICY "Usuários podem ver seus próprios treinos"
ON public.workouts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios treinos"
ON public.workouts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios treinos"
ON public.workouts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios treinos"
ON public.workouts
FOR DELETE
USING (auth.uid() = user_id);

-- Criar políticas RLS para workout_exercises
CREATE POLICY "Usuários podem ver exercícios dos seus treinos"
ON public.workout_exercises
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workouts 
    WHERE workouts.id = workout_exercises.workout_id 
    AND workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem criar exercícios nos seus treinos"
ON public.workout_exercises
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workouts 
    WHERE workouts.id = workout_exercises.workout_id 
    AND workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar exercícios dos seus treinos"
ON public.workout_exercises
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workouts 
    WHERE workouts.id = workout_exercises.workout_id 
    AND workouts.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar exercícios dos seus treinos"
ON public.workout_exercises
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workouts 
    WHERE workouts.id = workout_exercises.workout_id 
    AND workouts.user_id = auth.uid()
  )
);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at
    BEFORE UPDATE ON public.workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_day_of_week ON public.workouts(day_of_week);
CREATE INDEX idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_order ON public.workout_exercises(workout_id, exercise_order);