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
        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select(`
            id,
            name,
            created_at,
            workout_exercises(
              exercise_name,
              weight,
              sets,
              reps
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (workoutsError) throw workoutsError;

        // Processar dados dos últimos 30 dias
        const last30Days = Array.from({ length: 30 }, (_, i) => {
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
              return exerciseSum + (exercise.weight * exercise.sets * exercise.reps);
            }, 0);
          }, 0);

          return {
            date: date.slice(5), // MM-DD format
            workouts: cumulativeWorkouts,
            weight: totalWeight,
            day: index + 1
          };
        });

        // Buscar recordes de exercícios para dados de força
        const { data: records, error: recordsError } = await supabase
          .from('exercise_records')
          .select('exercise_name, max_weight, achieved_at')
          .eq('user_id', user.id)
          .order('achieved_at', { ascending: false })
          .limit(10);

        if (recordsError) throw recordsError;

        // Agrupar recordes por exercício
        const exerciseRecords = records?.reduce((acc, record) => {
          if (!acc[record.exercise_name]) {
            acc[record.exercise_name] = record.max_weight;
          }
          return acc;
        }, {} as any) || {};

        // Criar dados de força (top 5 exercícios)
        const strengthProgress = Object.entries(exerciseRecords)
          .slice(0, 5)
          .map(([exercise, weight]) => ({
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
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="floating-card p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-primary mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">Total de Treinos</p>
              <p className="text-2xl font-bold">{stats?.total_workouts || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="floating-card p-4">
          <div className="flex items-center">
            <Dumbbell className="w-8 h-8 text-primary mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">Peso Total</p>
              <p className="text-2xl font-bold">{stats?.total_weight_lifted?.toFixed(0) || 0}kg</p>
            </div>
          </div>
        </Card>
        
        <Card className="floating-card p-4">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-primary mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">Sequência Atual</p>
              <p className="text-2xl font-bold">{stats?.current_streak || 0} dias</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Evolução de Treinos */}
      <Card className="floating-card p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold">Evolução de Treinos (30 dias)</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={workoutData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Line 
              type="monotone" 
              dataKey="workouts" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de Peso por Treino */}
      <Card className="floating-card p-6">
        <div className="flex items-center mb-4">
          <Dumbbell className="w-5 h-5 text-primary mr-2" />
          <h3 className="text-lg font-semibold">Volume de Peso por Treino</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={workoutData.filter(d => d.weight > 0)}>
            <XAxis dataKey="date" />
            <YAxis />
            <Area 
              type="monotone" 
              dataKey="weight" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary) / 0.2)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de Recordes por Exercício */}
      {strengthData.length > 0 && (
        <Card className="floating-card p-6">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Recordes por Exercício</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={strengthData}>
              <XAxis 
                dataKey="exercise" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Bar 
                dataKey="weight" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>;
};