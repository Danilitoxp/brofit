-- Criar tabela de recordes pessoais por exercício
CREATE TABLE public.exercise_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  max_weight DECIMAL(5,2) NOT NULL DEFAULT 0,
  max_reps INTEGER NOT NULL DEFAULT 0,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_name)
);

-- Criar tabela de amizades
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'workout_completed', 'new_record')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para exercise_records
CREATE POLICY "Usuários podem ver recordes de perfis públicos ou amigos"
ON public.exercise_records
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = exercise_records.user_id 
    AND profiles.is_public = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE ((requester_id = auth.uid() AND addressee_id = exercise_records.user_id) OR
           (addressee_id = auth.uid() AND requester_id = exercise_records.user_id))
    AND status = 'accepted'
  )
);

CREATE POLICY "Usuários podem criar seus próprios recordes"
ON public.exercise_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios recordes"
ON public.exercise_records
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios recordes"
ON public.exercise_records
FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para friendships
CREATE POLICY "Usuários podem ver amizades que envolvem eles"
ON public.friendships
FOR SELECT
USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Usuários podem criar convites de amizade"
ON public.friendships
FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Usuários podem atualizar amizades que envolvem eles"
ON public.friendships
FOR UPDATE
USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Usuários podem deletar amizades que envolvem eles"
ON public.friendships
FOR DELETE
USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Políticas RLS para notifications
CREATE POLICY "Usuários podem ver suas próprias notificações"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar notificações"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias notificações"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_exercise_records_updated_at
    BEFORE UPDATE ON public.exercise_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar notificação de amizade
CREATE OR REPLACE FUNCTION public.create_friendship_notification()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificações de amizade
CREATE TRIGGER friendship_notification_trigger
  AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.create_friendship_notification();

-- Função para atualizar recordes pessoais
CREATE OR REPLACE FUNCTION public.update_exercise_record(
  p_exercise_name TEXT,
  p_weight DECIMAL(5,2),
  p_reps INTEGER
)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para performance
CREATE INDEX idx_exercise_records_user_id ON public.exercise_records(user_id);
CREATE INDEX idx_exercise_records_exercise_name ON public.exercise_records(exercise_name);
CREATE INDEX idx_exercise_records_max_weight ON public.exercise_records(max_weight DESC);
CREATE INDEX idx_friendships_requester_id ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee_id ON public.friendships(addressee_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);