-- Criar função para calcular streak baseado em presença diária
CREATE OR REPLACE FUNCTION public.calculate_presence_streak(p_user_id uuid)
RETURNS TABLE(current_streak integer, longest_streak integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  today_date DATE := CURRENT_DATE;
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
BEGIN
  -- Calcular streak baseado em dias únicos de presença
  WITH daily_presence AS (
    SELECT DISTINCT DATE(last_seen_at) AS presence_date
    FROM public.user_presence
    WHERE user_id = p_user_id AND DATE(last_seen_at) <= today_date
    ORDER BY presence_date DESC
  ), streak_calc AS (
    SELECT 
      presence_date,
      ROW_NUMBER() OVER (ORDER BY presence_date DESC) AS rn,
      (today_date::DATE - presence_date) AS days_diff
    FROM daily_presence
  ), current_streak_calc AS (
    SELECT COUNT(*) AS streak_count
    FROM streak_calc
    WHERE days_diff = rn - 1 AND presence_date >= today_date - INTERVAL '365 days'
  ), all_streaks AS (
    SELECT 
      presence_date,
      ROW_NUMBER() OVER (ORDER BY presence_date) AS rn,
      (presence_date::DATE - (ROW_NUMBER() OVER (ORDER BY presence_date) - 1)) AS streak_group
    FROM daily_presence
  ), longest_streak_calc AS (
    SELECT MAX(streak_length) AS max_streak
    FROM (
      SELECT COUNT(*) AS streak_length
      FROM all_streaks
      GROUP BY streak_group
    ) sub
  )
  SELECT 
    COALESCE(csc.streak_count, 0),
    COALESCE(lsc.max_streak, 0)
  INTO v_current_streak, v_longest_streak
  FROM current_streak_calc csc, longest_streak_calc lsc;

  RETURN QUERY SELECT v_current_streak, v_longest_streak;
END;
$function$;

-- Criar função para atualizar streak de presença
CREATE OR REPLACE FUNCTION public.update_presence_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  streak_data RECORD;
BEGIN
  -- Calcular novo streak
  SELECT * INTO streak_data 
  FROM public.calculate_presence_streak(NEW.user_id);

  -- Atualizar workout_stats com novo streak
  INSERT INTO public.workout_stats (user_id, current_streak, longest_streak, updated_at)
  VALUES (NEW.user_id, streak_data.current_streak, streak_data.longest_streak, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    current_streak = streak_data.current_streak,
    longest_streak = GREATEST(workout_stats.longest_streak, streak_data.longest_streak),
    updated_at = now();

  RETURN NEW;
END;
$function$;

-- Criar trigger para atualizar streak quando user_presence é atualizada
DROP TRIGGER IF EXISTS trigger_update_presence_streak ON public.user_presence;
CREATE TRIGGER trigger_update_presence_streak
  AFTER INSERT OR UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_presence_streak();