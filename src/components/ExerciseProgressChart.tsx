import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ExerciseData {
  date: string;
  weight: number;
  reps: number;
  volume: number;
}

export const ExerciseProgressChart = () => {
  const [exerciseData, setExerciseData] = useState<ExerciseData[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchExercises();
  }, [user]);

  useEffect(() => {
    if (selectedExercise && user) {
      fetchExerciseProgress();
    }
  }, [selectedExercise, user]);

  const fetchExercises = async () => {
    try {
      // First get workout IDs for the user
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user!.id);

      if (workoutsError) throw workoutsError;

      if (!workouts || workouts.length === 0) {
        setExercises([]);
        setLoading(false);
        return;
      }

      const workoutIds = workouts.map(w => w.id);

      const { data, error } = await supabase
        .from('workout_exercises')
        .select('exercise_name')
        .in('workout_id', workoutIds)
        .order('exercise_name');

      if (error) throw error;

      // Get unique exercise names
      const uniqueExercises = [...new Set(data?.map(item => item.exercise_name) || [])];
      setExercises(uniqueExercises);
      
      if (uniqueExercises.length > 0 && !selectedExercise) {
        setSelectedExercise(uniqueExercises[0]);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseProgress = async () => {
    if (!selectedExercise || !user) return;

    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          weight,
          reps,
          sets,
          created_at,
          workouts!inner(
            user_id,
            created_at
          )
        `)
        .eq('exercise_name', selectedExercise)
        .eq('workouts.user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const progressData = data?.map(item => ({
        date: format(new Date(item.workouts.created_at), 'dd/MM', { locale: pt }),
        weight: item.weight || 0,
        reps: item.reps,
        volume: (item.weight || 0) * item.reps * item.sets
      })) || [];

      // Group by date and get the max values per day
      const groupedData = progressData.reduce((acc, curr) => {
        const existingDay = acc.find(item => item.date === curr.date);
        if (existingDay) {
          existingDay.weight = Math.max(existingDay.weight, curr.weight);
          existingDay.volume = Math.max(existingDay.volume, curr.volume);
          existingDay.reps = Math.max(existingDay.reps, curr.reps);
        } else {
          acc.push(curr);
        }
        return acc;
      }, [] as ExerciseData[]);

      setExerciseData(groupedData);
    } catch (error) {
      console.error('Error fetching exercise progress:', error);
    }
  };

  if (loading) {
    return (
      <Card className="floating-card p-6">
        <div className="text-center">Carregando...</div>
      </Card>
    );
  }

  if (exercises.length === 0) {
    return (
      <Card className="floating-card p-6">
        <div className="text-center text-muted-foreground">
          Nenhum exercício encontrado. Crie alguns treinos primeiro!
        </div>
      </Card>
    );
  }

  return (
    <Card className="floating-card p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Progresso por Exercício</h3>
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione um exercício" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((exercise) => (
                <SelectItem key={exercise} value={exercise}>
                  {exercise}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {exerciseData.length > 0 ? (
          <div className="space-y-6">
            {/* Gráfico de Peso */}
            <div>
              <h4 className="text-md font-medium mb-3">Evolução do Peso (kg)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(label) => `Data: ${label}`}
                      formatter={(value: number) => [`${value} kg`, 'Peso']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Volume */}
            <div>
              <h4 className="text-md font-medium mb-3">Evolução do Volume (kg × reps × sets)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(label) => `Data: ${label}`}
                      formatter={(value: number) => [`${value} kg`, 'Volume']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--secondary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado encontrado para o exercício selecionado.
          </div>
        )}
      </div>
    </Card>
  );
};