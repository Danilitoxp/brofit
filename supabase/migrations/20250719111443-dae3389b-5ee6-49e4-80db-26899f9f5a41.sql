-- Função para atualizar sequência de treinos e conquistar conquistas
CREATE OR REPLACE FUNCTION public.update_workout_stats_and_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_stats RECORD;
  today_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  workout_count INTEGER;
BEGIN
  -- Obter estatísticas atuais do usuário
  SELECT * INTO user_stats 
  FROM public.workout_stats 
  WHERE user_id = NEW.user_id;

  -- Contar treinos de hoje
  SELECT COUNT(*) INTO workout_count
  FROM public.workouts
  WHERE user_id = NEW.user_id 
  AND DATE(created_at) = today_date;

  -- Se for o primeiro treino de hoje, atualizar sequência
  IF workout_count = 1 THEN
    -- Verificar se treinou ontem para manter a sequência
    IF user_stats.last_workout_date = yesterday_date THEN
      -- Manter sequência
      UPDATE public.workout_stats 
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_workout_date = today_date,
        total_workouts = total_workouts + 1,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSE
      -- Iniciar nova sequência
      UPDATE public.workout_stats 
      SET 
        current_streak = 1,
        longest_streak = GREATEST(longest_streak, 1),
        last_workout_date = today_date,
        total_workouts = total_workouts + 1,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  ELSE
    -- Apenas incrementar total de treinos
    UPDATE public.workout_stats 
    SET 
      total_workouts = total_workouts + 1,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  -- Verificar e conceder conquistas
  PERFORM public.check_and_grant_achievements(NEW.user_id);

  RETURN NEW;
END;
$$;

-- Criar trigger para treinos criados
DROP TRIGGER IF EXISTS workout_created_trigger ON public.workouts;
CREATE TRIGGER workout_created_trigger
  AFTER INSERT ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workout_stats_and_achievements();

-- Função para atualizar estatísticas quando exercícios são adicionados
CREATE OR REPLACE FUNCTION public.update_exercise_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_weight NUMERIC := 0;
  total_exercises_count INTEGER := 0;
BEGIN
  -- Calcular peso total e número de exercícios do usuário
  SELECT 
    COALESCE(SUM(we.weight * we.sets * we.reps), 0),
    COUNT(*)
  INTO total_weight, total_exercises_count
  FROM public.workout_exercises we
  JOIN public.workouts w ON w.id = we.workout_id
  WHERE w.user_id = (
    SELECT user_id FROM public.workouts WHERE id = NEW.workout_id
  );

  -- Atualizar estatísticas
  UPDATE public.workout_stats 
  SET 
    total_weight_lifted = total_weight,
    total_exercises = total_exercises_count,
    updated_at = now()
  WHERE user_id = (
    SELECT user_id FROM public.workouts WHERE id = NEW.workout_id
  );

  -- Atualizar recordes de exercícios
  PERFORM public.update_exercise_record(NEW.exercise_name, NEW.weight, NEW.reps);

  RETURN NEW;
END;
$$;

-- Criar trigger para exercícios adicionados
DROP TRIGGER IF EXISTS exercise_added_trigger ON public.workout_exercises;
CREATE TRIGGER exercise_added_trigger
  AFTER INSERT ON public.workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_exercise_stats();