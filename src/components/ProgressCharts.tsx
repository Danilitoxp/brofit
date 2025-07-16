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
  const { user } = useAuth();
  const { stats } = useProfile();

  useEffect(() => {
    if (!user) return;

    const fetchProgressData = async () => {
      try {
        // Simular dados dos últimos 30 dias para demonstração
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        });

        // Gerar dados simulados de treinos
        const workoutProgress = last30Days.map((date, index) => {
          const hasWorkout = Math.random() > 0.6; // 40% chance de treino
          const totalWorkouts = hasWorkout ? Math.floor(index / 7) + 1 : Math.floor(index / 7);
          return {
            date: date.slice(5), // MM-DD format
            workouts: totalWorkouts,
            weight: hasWorkout ? Math.floor(Math.random() * 2000) + 1000 : 0,
            day: index + 1
          };
        });

        // Dados de força por exercício (simulado)
        const strengthProgress = [
          { exercise: 'Supino', weight: 80, previous: 75 },
          { exercise: 'Agachamento', weight: 120, previous: 110 },
          { exercise: 'Levantamento Terra', weight: 140, previous: 135 },
          { exercise: 'Desenvolvimento', weight: 60, previous: 55 },
          { exercise: 'Rosca Direta', weight: 25, previous: 22 },
        ];

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
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="floating-card p-4 animate-pulse">
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="stat-card">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="text-secondary" size={24} />
          </div>
          <p className="text-2xl font-bold text-secondary">
            {stats?.total_workouts || 0}
          </p>
          <p className="text-muted-foreground text-sm">Treinos</p>
        </Card>

        <Card className="stat-card">
          <div className="flex items-center justify-center mb-2">
            <Dumbbell className="text-accent" size={24} />
          </div>
          <p className="text-2xl font-bold text-accent">
            {stats?.total_weight_lifted ? `${Math.round(stats.total_weight_lifted / 1000)}K` : '0'}
          </p>
          <p className="text-muted-foreground text-sm">kg Levantados</p>
        </Card>
      </div>

      {/* Gráfico de Treinos */}
      <Card className="floating-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-primary" size={20} />
          <h3 className="font-semibold">Progresso de Treinos (30 dias)</h3>
        </div>
        
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={workoutData}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Area 
                type="monotone" 
                dataKey="workouts" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico de Peso Levantado */}
      <Card className="floating-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="text-secondary" size={20} />
          <h3 className="font-semibold">Peso Levantado (30 dias)</h3>
        </div>
        
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={workoutData}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: 'hsl(var(--secondary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico de Força por Exercício */}
      <Card className="floating-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="text-accent" size={20} />
          <h3 className="font-semibold">Força por Exercício</h3>
        </div>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strengthData} layout="horizontal">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="exercise" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                width={80}
              />
              <Bar 
                dataKey="weight" 
                fill="hsl(var(--accent))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};