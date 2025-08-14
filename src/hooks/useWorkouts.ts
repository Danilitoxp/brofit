import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface WorkoutSet {
  id?: string;
  set_number: number;
  reps: number;
  weight: number;
  completed?: boolean;
}

export interface WorkoutExercise {
  id?: string;
  exercise_name: string;
  sets: WorkoutSet[]; // Agora é um array de séries
  exercise_order: number;
}

export interface Workout {
  id?: string;
  name: string;
  description?: string;
  day_of_week?: number;
  exercises: WorkoutExercise[];
}

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWorkouts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar treinos com exercícios e suas séries
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises!inner (
            id,
            exercise_name,
            exercise_order,
            workout_sets (
              id,
              set_number,
              reps,
              weight,
              completed
            )
          )
        `)
        .eq('user_id', user.id)
        .order('day_of_week', { nullsFirst: false });

      if (workoutsError) throw workoutsError;

      // Transformar dados para o formato esperado
      const formattedWorkouts: Workout[] = workoutsData?.map(workout => ({
        id: workout.id,
        name: workout.name,
        description: workout.description,
        day_of_week: workout.day_of_week,
        exercises: workout.workout_exercises
          .sort((a, b) => a.exercise_order - b.exercise_order)
          .map(exercise => ({
            id: exercise.id,
            exercise_name: exercise.exercise_name,
            exercise_order: exercise.exercise_order,
            sets: exercise.workout_sets
              .sort((a, b) => a.set_number - b.set_number)
              .map(set => ({
                id: set.id,
                set_number: set.set_number,
                reps: set.reps,
                weight: set.weight,
                completed: set.completed
              }))
          }))
      })) || [];

      setWorkouts(formattedWorkouts);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      toast({
        title: "Erro ao carregar treinos",
        description: "Não foi possível carregar seus treinos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkout = async (workout: Workout) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar um treino.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Criando treino:', workout);
      console.log('User ID:', user.id);

      // Criar o treino principal
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          name: workout.name,
          description: workout.description,
          day_of_week: workout.day_of_week,
          user_id: user.id
        })
        .select()
        .single();

      if (workoutError) throw workoutError;
      console.log('Workout criado:', workoutData);

      if (workout.exercises && workout.exercises.length > 0) {
        // Criar exercícios
        for (const exercise of workout.exercises) {
          const { data: exerciseData, error: exerciseError } = await supabase
            .from('workout_exercises')
            .insert({
              workout_id: workoutData.id,
              exercise_name: exercise.exercise_name,
              exercise_order: exercise.exercise_order
            })
            .select()
            .single();

          if (exerciseError) throw exerciseError;

          // Criar séries para cada exercício
          if (exercise.sets && exercise.sets.length > 0) {
            const setsToInsert = exercise.sets.map(set => ({
              workout_exercise_id: exerciseData.id,
              set_number: set.set_number,
              reps: set.reps,
              weight: set.weight
            }));

            const { error: setsError } = await supabase
              .from('workout_sets')
              .insert(setsToInsert);

            if (setsError) throw setsError;
          }
        }
      }

      // Recarregar treinos
      await fetchWorkouts();
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      toast({
        title: "Erro ao criar treino",
        description: "Não foi possível criar o treino. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const updateWorkout = async (workoutId: string, workout: Workout) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para atualizar um treino.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Atualizar treino principal
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({
          name: workout.name,
          description: workout.description,
          day_of_week: workout.day_of_week
        })
        .eq('id', workoutId)
        .eq('user_id', user.id);

      if (workoutError) throw workoutError;

      // Buscar exercícios existentes
      const { data: existingExercises } = await supabase
        .from('workout_exercises')
        .select('id')
        .eq('workout_id', workoutId);

      // Remover exercícios existentes e suas séries (CASCADE vai remover as séries)
      if (existingExercises && existingExercises.length > 0) {
        const { error: deleteError } = await supabase
          .from('workout_exercises')
          .delete()
          .eq('workout_id', workoutId);

        if (deleteError) throw deleteError;
      }

      // Criar novos exercícios
      if (workout.exercises && workout.exercises.length > 0) {
        for (const exercise of workout.exercises) {
          const { data: exerciseData, error: exerciseError } = await supabase
            .from('workout_exercises')
            .insert({
              workout_id: workoutId,
              exercise_name: exercise.exercise_name,
              exercise_order: exercise.exercise_order
            })
            .select()
            .single();

          if (exerciseError) throw exerciseError;

          // Criar séries para cada exercício
          if (exercise.sets && exercise.sets.length > 0) {
            const setsToInsert = exercise.sets.map(set => ({
              workout_exercise_id: exerciseData.id,
              set_number: set.set_number,
              reps: set.reps,
              weight: set.weight
            }));

            const { error: setsError } = await supabase
              .from('workout_sets')
              .insert(setsToInsert);

            if (setsError) throw setsError;
          }
        }
      }

      await fetchWorkouts();
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      toast({
        title: "Erro ao atualizar treino",
        description: "Não foi possível atualizar o treino. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;

      await fetchWorkouts();
      toast({
        title: "Treino excluído!",
        description: "O treino foi excluído com sucesso."
      });
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      toast({
        title: "Erro ao excluir treino",
        description: "Não foi possível excluir o treino. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [user]);

  return {
    workouts,
    loading,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    refetch: fetchWorkouts
  };
};