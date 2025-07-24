-- Criar tabela para séries individuais
CREATE TABLE public.workout_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL DEFAULT 1,
  weight NUMERIC(5,2) DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_workout_sets_exercise_id ON public.workout_sets(workout_exercise_id);
CREATE INDEX idx_workout_sets_set_number ON public.workout_sets(set_number);

-- RLS policies
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout sets" 
ON public.workout_sets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own workout sets" 
ON public.workout_sets 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own workout sets" 
ON public.workout_sets 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own workout sets" 
ON public.workout_sets 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_workout_sets_updated_at
BEFORE UPDATE ON public.workout_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();