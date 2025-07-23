-- Corrigir constraint de tipos de notificação
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Adicionar constraint correta com todos os tipos necessários
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('friend_request', 'friend_accepted', 'new_record', 'achievement_earned', 'workout_reminder'));