-- Recriar os triggers que faltam
CREATE TRIGGER workout_created_trigger
    AFTER INSERT ON public.workouts
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_workout_stats_and_achievements();

CREATE TRIGGER exercise_added_trigger
    AFTER INSERT ON public.workout_exercises
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_exercise_stats();

-- Inserir dados de teste para workout e exercicios
INSERT INTO public.workouts (user_id, name, description) 
VALUES (auth.uid(), 'Treino Teste', 'Treino para testar conquistas');

-- Buscar o workout criado para inserir exercícios
DO $$
DECLARE
    workout_id_var UUID;
BEGIN
    SELECT id INTO workout_id_var FROM public.workouts WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1;
    
    INSERT INTO public.workout_exercises (workout_id, exercise_name, sets, reps, weight, exercise_order)
    VALUES 
        (workout_id_var, 'Supino Reto', 3, 12, 50, 0),
        (workout_id_var, 'Crucifixo', 3, 15, 20, 1);
END $$;