-- Corrigir funções com search_path não definido
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.workout_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_friendship_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Notificação quando convite é enviado
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.addressee_id,
      'friend_request',
      'Novo convite de amizade!',
      'Você recebeu um convite de amizade.',
      jsonb_build_object('friendship_id', NEW.id, 'requester_id', NEW.requester_id)
    );
    RETURN NEW;
  END IF;

  -- Notificação quando convite é aceito
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.requester_id,
      'friend_accepted',
      'Convite aceito!',
      'Seu convite de amizade foi aceito.',
      jsonb_build_object('friendship_id', NEW.id, 'friend_id', NEW.addressee_id)
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_exercise_record(p_exercise_name text, p_weight numeric, p_reps integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_record RECORD;
BEGIN
  -- Buscar recorde atual
  SELECT * INTO current_record 
  FROM public.exercise_records 
  WHERE user_id = auth.uid() AND exercise_name = p_exercise_name;

  -- Se não existe recorde, criar novo
  IF current_record IS NULL THEN
    INSERT INTO public.exercise_records (user_id, exercise_name, max_weight, max_reps)
    VALUES (auth.uid(), p_exercise_name, p_weight, p_reps);
    
    -- Criar notificação de novo recorde
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      auth.uid(),
      'new_record',
      'Novo recorde pessoal!',
      'Você estabeleceu um novo recorde em ' || p_exercise_name || '!',
      jsonb_build_object('exercise', p_exercise_name, 'weight', p_weight, 'reps', p_reps)
    );
  
  -- Se o novo peso é maior, atualizar
  ELSIF p_weight > current_record.max_weight THEN
    UPDATE public.exercise_records 
    SET max_weight = p_weight, max_reps = p_reps, achieved_at = now()
    WHERE user_id = auth.uid() AND exercise_name = p_exercise_name;
    
    -- Criar notificação de novo recorde
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      auth.uid(),
      'new_record',
      'Novo recorde pessoal!',
      'Você superou seu recorde em ' || p_exercise_name || '!',
      jsonb_build_object('exercise', p_exercise_name, 'weight', p_weight, 'reps', p_reps, 'previous_weight', current_record.max_weight)
    );
  
  -- Se mesmo peso mas mais reps, atualizar reps
  ELSIF p_weight = current_record.max_weight AND p_reps > current_record.max_reps THEN
    UPDATE public.exercise_records 
    SET max_reps = p_reps, achieved_at = now()
    WHERE user_id = auth.uid() AND exercise_name = p_exercise_name;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND role = 'admin'
  );
$function$;

-- Criar tabela para subscrições de push notifications
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Habilitar RLS na tabela
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para push_subscriptions
CREATE POLICY "Usuários podem criar suas próprias subscrições" 
ON public.push_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas próprias subscrições" 
ON public.push_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias subscrições" 
ON public.push_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias subscrições" 
ON public.push_subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Sistema pode acessar subscrições para enviar notificações
CREATE POLICY "Sistema pode acessar subscrições para notificações" 
ON public.push_subscriptions 
FOR SELECT 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar trigger para criar notificações de amizade
DROP TRIGGER IF EXISTS friendship_notification_trigger ON public.friendships;
CREATE TRIGGER friendship_notification_trigger
AFTER INSERT OR UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.create_friendship_notification();