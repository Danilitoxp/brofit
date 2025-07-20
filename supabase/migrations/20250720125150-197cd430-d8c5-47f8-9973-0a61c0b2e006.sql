-- Inserir um treino de teste para ativar as conquistas
INSERT INTO public.workouts (user_id, name, description) 
VALUES (auth.uid(), 'Treino Conquista Teste', 'Treino para testar sistema de conquistas');