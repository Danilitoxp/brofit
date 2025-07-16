-- Criar tabela para conquistas/badges
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL, -- 'workout', 'strength', 'streak', 'milestone'
  requirement_type text NOT NULL, -- 'total_workouts', 'current_streak', 'total_weight', 'exercise_record'
  requirement_value numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela para conquistas dos usuários
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Criar tabela para feed de atividades
CREATE TABLE public.activity_feed (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'workout_completed', 'achievement_earned', 'record_broken', 'streak_milestone'
  title text NOT NULL,
  description text NOT NULL,
  data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Políticas para achievements (todos podem ver)
CREATE POLICY "Todos podem ver conquistas" 
ON public.achievements 
FOR SELECT 
USING (true);

-- Políticas para user_achievements
CREATE POLICY "Usuários podem ver suas próprias conquistas" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar conquistas para usuários" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true);

-- Políticas para activity_feed
CREATE POLICY "Usuários podem ver atividades de amigos e próprias" 
ON public.activity_feed 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE ((requester_id = auth.uid() AND addressee_id = activity_feed.user_id) 
           OR (addressee_id = auth.uid() AND requester_id = activity_feed.user_id))
    AND status = 'accepted'
  )
);

CREATE POLICY "Sistema pode criar atividades" 
ON public.activity_feed 
FOR INSERT 
WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir conquistas padrão
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value) VALUES
('Primeiro Treino', 'Complete seu primeiro treino', '🎯', 'milestone', 'total_workouts', 1),
('Dedicação', 'Complete 10 treinos', '💪', 'workout', 'total_workouts', 10),
('Veterano', 'Complete 50 treinos', '🏆', 'workout', 'total_workouts', 50),
('Máquina', 'Complete 100 treinos', '⚡', 'workout', 'total_workouts', 100),
('Sequência Iniciante', 'Mantenha uma sequência de 3 dias', '🔥', 'streak', 'current_streak', 3),
('Sequência Sólida', 'Mantenha uma sequência de 7 dias', '🌟', 'streak', 'current_streak', 7),
('Sequência Imparável', 'Mantenha uma sequência de 30 dias', '👑', 'streak', 'current_streak', 30),
('Força Bruta', 'Levante um total de 10.000kg', '🦍', 'strength', 'total_weight', 10000),
('Monstro do Ferro', 'Levante um total de 50.000kg', '💀', 'strength', 'total_weight', 50000);

-- Função para verificar e conceder conquistas
CREATE OR REPLACE FUNCTION public.check_and_grant_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  user_stat RECORD;
  achievement RECORD;
  should_grant BOOLEAN;
BEGIN
  -- Buscar estatísticas do usuário
  SELECT * INTO user_stat 
  FROM public.workout_stats 
  WHERE user_id = p_user_id;

  -- Se não tem stats, não fazer nada
  IF user_stat IS NULL THEN
    RETURN;
  END IF;

  -- Verificar cada conquista
  FOR achievement IN SELECT * FROM public.achievements LOOP
    -- Verificar se usuário já tem essa conquista
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = p_user_id AND achievement_id = achievement.id
    ) THEN
      should_grant := false;
      
      -- Verificar condições baseadas no tipo
      CASE achievement.requirement_type
        WHEN 'total_workouts' THEN
          should_grant := (user_stat.total_workouts >= achievement.requirement_value);
        WHEN 'current_streak' THEN
          should_grant := (user_stat.current_streak >= achievement.requirement_value);
        WHEN 'total_weight' THEN
          should_grant := (user_stat.total_weight_lifted >= achievement.requirement_value);
        ELSE
          should_grant := false;
      END CASE;
      
      -- Conceder conquista se condições atendidas
      IF should_grant THEN
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (p_user_id, achievement.id);
        
        -- Criar notificação
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
          p_user_id,
          'achievement_earned',
          'Nova Conquista! ' || achievement.icon,
          'Você desbloqueou: ' || achievement.name,
          jsonb_build_object('achievement_id', achievement.id, 'achievement_name', achievement.name)
        );
        
        -- Adicionar ao feed de atividades
        INSERT INTO public.activity_feed (user_id, type, title, description, data)
        VALUES (
          p_user_id,
          'achievement_earned',
          'Nova Conquista Desbloqueada!',
          achievement.name || ' - ' || achievement.description,
          jsonb_build_object('achievement_id', achievement.id, 'icon', achievement.icon)
        );
      END IF;
    END IF;
  END LOOP;
END;
$function$;