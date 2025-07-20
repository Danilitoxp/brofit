import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface WorkoutExercise {
  id?: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
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

    try {
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true });

      if (workoutsError) throw workoutsError;

      const workoutsWithExercises = await Promise.all(
        workoutsData?.map(async (workout) => {
          const { data: exercises, error: exercisesError } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('workout_id', workout.id)
            .order('exercise_order', { ascending: true });

          if (exercisesError) throw exercisesError;

          return {
            id: workout.id,
            name: workout.name,
            description: workout.description,
            day_of_week: workout.day_of_week,
            exercises: exercises || []
          };
        }) || []
      );

      setWorkouts(workoutsWithExercises);
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os treinos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkout = async (workout: Workout) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar treinos.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Criando treino:', workout);
      console.log('User ID:', user.id);

      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: workout.name,
          description: workout.description,
          day_of_week: workout.day_of_week
        })
        .select()
        .single();

      if (workoutError) {
        console.error('Erro ao criar workout:', workoutError);
        throw workoutError;
      }

      console.log('Workout criado:', workoutData);

      if (workout.exercises.length > 0) {
        const exercisesToInsert = workout.exercises.map((exercise, index) => ({
          workout_id: workoutData.id,
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight || 0,
          exercise_order: index
        }));

        console.log('Inserindo exercícios:', exercisesToInsert);

        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert);

        if (exercisesError) {
          console.error('Erro ao inserir exercícios:', exercisesError);
          throw exercisesError;
        }

        console.log('Exercícios inseridos com sucesso');
      }

      await fetchWorkouts();
      toast({
        title: "Sucesso",
        description: "Treino criado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o treino.",
        variant: "destructive"
      });
    }
  };

  const updateWorkout = async (workoutId: string, workout: Workout) => {
    if (!user) return;

    try {
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({
          name: workout.name,
          description: workout.description,
          day_of_week: workout.day_of_week
        })
        .eq('id', workoutId);

      if (workoutError) throw workoutError;

      // Deletar exercícios existentes
      const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workoutId);

      if (deleteError) throw deleteError;

      // Inserir novos exercícios
      if (workout.exercises.length > 0) {
        const exercisesToInsert = workout.exercises.map((exercise, index) => ({
          workout_id: workoutId,
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          exercise_order: index
        }));

        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;
      }

      await fetchWorkouts();
      toast({
        title: "Sucesso",
        description: "Treino atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o treino.",
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
        title: "Sucesso",
        description: "Treino excluído com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o treino.",
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