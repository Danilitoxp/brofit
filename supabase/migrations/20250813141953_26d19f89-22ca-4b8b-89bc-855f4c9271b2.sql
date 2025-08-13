-- Corrigir o trigger que está causando ambiguidade na criação de treinos
DROP TRIGGER IF EXISTS update_workout_stats_trigger ON workouts;

-- Recriar a função sem ambiguidade
CREATE OR REPLACE FUNCTION public.update_workout_stats_and_achievements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  today_date DATE := CURRENT_DATE;
  workout_user_id UUID := NEW.user_id;
  v_total_workouts INTEGER := 0;
  v_last_workout DATE := NULL;
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
BEGIN
  -- Totais e última data
  SELECT COUNT(*), MAX(DATE(created_at))
    INTO v_total_workouts, v_last_workout
  FROM public.workouts
  WHERE user_id = workout_user_id;

  -- Conjunto de dias treinados até hoje
  WITH ds AS (
    SELECT DISTINCT DATE(created_at) AS d
    FROM public.workouts
    WHERE user_id = workout_user_id AND DATE(created_at) <= today_date
  ), ordered AS (
    SELECT d, ROW_NUMBER() OVER (ORDER BY d) AS rn FROM ds
  ), grp AS (
    SELECT d, rn, (d::timestamp - (rn || ' days')::interval)::date AS g FROM ordered
  )
  SELECT
    COALESCE((SELECT COUNT(*) FROM grp WHERE d = today_date AND g = (SELECT g FROM grp WHERE d = today_date)), 0),
    COALESCE((SELECT MAX(cnt) FROM (SELECT COUNT(*) AS cnt FROM grp GROUP BY g) x), 0)
  INTO v_current_streak, v_longest_streak;

  -- Atualizar workout_stats com recomputação completa
  INSERT INTO public.workout_stats (user_id, total_workouts, current_streak, longest_streak, last_workout_date, updated_at)
  VALUES (workout_user_id, v_total_workouts, v_current_streak, v_longest_streak, v_last_workout, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_workouts = v_total_workouts,
    current_streak = v_current_streak,
    longest_streak = GREATEST(workout_stats.longest_streak, v_longest_streak),
    last_workout_date = v_last_workout,
    updated_at = now();

  -- Verificar e conceder conquistas
  PERFORM public.check_and_grant_achievements(workout_user_id);

  RETURN NEW;
END;
$function$;

-- Recriar o trigger
CREATE TRIGGER update_workout_stats_trigger
    AFTER INSERT ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_workout_stats_and_achievements();