import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, Dumbbell, Calendar, Target } from 'lucide-react';
export const ProgressCharts = () => {
  const [workoutData, setWorkoutData] = useState([]);
  const [strengthData, setStrengthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    user
  } = useAuth();
  const {
    stats
  } = useProfile();
  useEffect(() => {
    if (!user) return;
    const fetchProgressData = async () => {
      try {
        // Buscar treinos criados do usuário
        const {
          data: workouts,
          error: workoutsError
        } = await supabase.from('workouts').select(`
            id,
            name,
            created_at,
            workout_exercises(
              exercise_name,
              weight,
              sets,
              reps
            )
          `).eq('user_id', user.id).order('created_at', {
          ascending: true
        });
        if (workoutsError) throw workoutsError;

        // Processar dados dos últimos 30 dias
        const last30Days = Array.from({
          length: 30
        }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        });

        // Mapear treinos por data
        const workoutsByDate = workouts?.reduce((acc, workout) => {
          const date = workout.created_at.split('T')[0];
          if (!acc[date]) acc[date] = [];
          acc[date].push(workout);
          return acc;
        }, {} as any) || {};

        // Criar dados de progresso de treinos
        let cumulativeWorkouts = 0;
        const workoutProgress = last30Days.map((date, index) => {
          const dayWorkouts = workoutsByDate[date] || [];
          if (dayWorkouts.length > 0) cumulativeWorkouts++;
          const totalWeight = dayWorkouts.reduce((sum, workout) => {
            return sum + (workout.workout_exercises || []).reduce((exerciseSum: number, exercise: any) => {
              return exerciseSum + exercise.weight * exercise.sets * exercise.reps;
            }, 0);
          }, 0);
          return {
            date: date.slice(5),
            // MM-DD format
            workouts: cumulativeWorkouts,
            weight: totalWeight,
            day: index + 1
          };
        });

        // Buscar recordes de exercícios para dados de força
        const {
          data: records,
          error: recordsError
        } = await supabase.from('exercise_records').select('exercise_name, max_weight, achieved_at').eq('user_id', user.id).order('achieved_at', {
          ascending: false
        }).limit(10);
        if (recordsError) throw recordsError;

        // Agrupar recordes por exercício
        const exerciseRecords = records?.reduce((acc, record) => {
          if (!acc[record.exercise_name]) {
            acc[record.exercise_name] = record.max_weight;
          }
          return acc;
        }, {} as any) || {};

        // Criar dados de força (top 5 exercícios)
        const strengthProgress = Object.entries(exerciseRecords).slice(0, 5).map(([exercise, weight]) => ({
          exercise,
          weight: Number(weight),
          previous: Number(weight) * 0.9 // Simular peso anterior (90% do atual)
        }));
        setWorkoutData(workoutProgress);
        setStrengthData(strengthProgress);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgressData();
  }, [user]);
  if (loading) {
    return <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Card key={i} className="floating-card p-4 animate-pulse">
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </Card>)}
      </div>;
  }
  return <div className="space-y-6">
      {/* Progresso por Exercício */}
      
    </div>;
};