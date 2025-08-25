import { useState, useEffect } from "react";
import { Calendar, Flame, TrendingUp, Target, Clock, Dumbbell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AchievementsWidget } from "@/components/AchievementsWidget";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ProgressCharts } from "@/components/ProgressCharts";
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workouts } = useWorkouts();
  const { profile, stats } = useProfile();
  const [currentDate] = useState(new Date());

  // Determinar treino de hoje baseado no dia da semana
  const getTodayWorkout = () => {
    const today = currentDate.getDay(); // 0 = domingo, 1 = segunda, etc.
    const todayWorkout = workouts.find(w => w.day_of_week === today);
    if (todayWorkout) {
      return {
        name: todayWorkout.name,
        exercises: todayWorkout.exercises.length,
        estimatedTime: todayWorkout.exercises.length * 12,
        // ~12min por exercício
        completed: false
      };
    }
    return {
      name: "Nenhum treino programado",
      exercises: 0,
      estimatedTime: 0,
      completed: false
    };
  };
  const todayWorkout = getTodayWorkout();
  const getWelcomeMessage = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };
  const getDayOfWeek = () => {
    return currentDate.toLocaleDateString('pt-BR', {
      weekday: 'long'
    });
  };
  const formatDate = () => {
    return currentDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long'
    });
  };
  return <div className="min-h-screen bg-background px-4 pt-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-lg font-bold">
                {(profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
              </h1>
              <p className="text-muted-foreground">
                @{profile?.nickname || user?.user_metadata?.nickname || 'usuario'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 floating-card p-3">
              <Flame className="text-accent" size={20} />
              <span className="font-bold text-lg">{stats?.current_streak || 0}</span>
            </div>
            
          </div>
        </div>
      </div>

      {/* Today's Workout Card */}
      <div className="floating-card mb-6 bg-gradient-primary p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-primary-foreground">
              Treino de Hoje
            </h2>
            <p className="text-primary-foreground/80">{todayWorkout.name}</p>
          </div>
          <div className="text-primary-foreground/80">
            <Calendar size={24} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-foreground">
              {todayWorkout.exercises}
            </p>
            <p className="text-primary-foreground/80 text-sm">Exercícios</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock size={16} className="text-primary-foreground/80" />
              <p className="text-2xl font-bold text-primary-foreground">
                {todayWorkout.estimatedTime}min
              </p>
            </div>
            <p className="text-primary-foreground/80 text-sm">Estimado</p>
          </div>
        </div>

        <Button variant="glass" size="lg" className="w-full text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10" onClick={() => {
        if (todayWorkout.exercises > 0) {
          const workout = workouts.find(w => w.day_of_week === currentDate.getDay());
          if (workout && workout.exercises.length > 0) {
            navigate('/start-workout', {
              state: {
                workout
              }
            });
          } else {
            // Se não tem treino específico para hoje, usar qualquer treino disponível
            const availableWorkout = workouts.find(w => w.exercises && w.exercises.length > 0);
            if (availableWorkout) {
              navigate('/start-workout', {
                state: {
                  workout: availableWorkout
                }
              });
            } else {
              navigate('/workouts');
            }
          }
        } else {
          navigate('/workouts');
        }
      }} disabled={todayWorkout.exercises === 0}>
          {todayWorkout.exercises > 0 ? todayWorkout.completed ? "Treino Concluído" : "Iniciar Treino" : "Criar Treino"}
        </Button>
      </div>

      {/* Weekly Stats Grid */}
      

      {/* Conquistas Widget */}
      <AchievementsWidget />

      {/* Progress Charts */}
      <ProgressCharts />

      {/* Activity Feed */}
      <ActivityFeed />

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-3">Ações Rápidas</h3>
        
        <Button variant="outline" className="w-full justify-start h-14" onClick={() => navigate('/progress')}>
          <TrendingUp className="mr-3" size={20} />
          Ver Evolução
        </Button>
      </div>

      {/* Motivation Quote */}
      
    </div>;
};
export default Dashboard;