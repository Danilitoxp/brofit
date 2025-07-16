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
        // Simular dados dos últimos 30 dias para demonstração
        const last30Days = Array.from({
          length: 30
        }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        });

        // Gerar dados simulados de treinos
        const workoutProgress = last30Days.map((date, index) => {
          const hasWorkout = Math.random() > 0.6; // 40% chance de treino
          const totalWorkouts = hasWorkout ? Math.floor(index / 7) + 1 : Math.floor(index / 7);
          return {
            date: date.slice(5),
            // MM-DD format
            workouts: totalWorkouts,
            weight: hasWorkout ? Math.floor(Math.random() * 2000) + 1000 : 0,
            day: index + 1
          };
        });

        // Dados de força por exercício (simulado)
        const strengthProgress = [{
          exercise: 'Supino',
          weight: 80,
          previous: 75
        }, {
          exercise: 'Agachamento',
          weight: 120,
          previous: 110
        }, {
          exercise: 'Levantamento Terra',
          weight: 140,
          previous: 135
        }, {
          exercise: 'Desenvolvimento',
          weight: 60,
          previous: 55
        }, {
          exercise: 'Rosca Direta',
          weight: 25,
          previous: 22
        }];
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
      

      {/* Gráfico de Treinos */}
      

      {/* Gráfico de Peso Levantado */}
      

      {/* Gráfico de Força por Exercício */}
      
    </div>;
};