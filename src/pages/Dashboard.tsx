import { useState, useEffect } from "react";
import { Calendar, Flame, TrendingUp, Target, Clock, Dumbbell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useProfile } from "@/hooks/useProfile";
import { AchievementsWidget } from "@/components/AchievementsWidget";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ProgressCharts } from "@/components/ProgressCharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const { workouts } = useWorkouts();
  const { stats } = useProfile();
  const [currentDate] = useState(new Date());

  // Determinar treino de hoje baseado no dia da semana
  const getTodayWorkout = () => {
    const today = currentDate.getDay(); // 0 = domingo, 1 = segunda, etc.
    const todayWorkout = workouts.find(w => w.day_of_week === today);
    
    if (todayWorkout) {
      return {
        name: todayWorkout.name,
        exercises: todayWorkout.exercises.length,
        estimatedTime: todayWorkout.exercises.length * 12, // ~12min por exercício
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
    return currentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const formatDate = () => {
    return currentDate.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long' 
    });
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
              {getWelcomeMessage()}, Bro!
            </h1>
            <p className="text-muted-foreground capitalize">
              {getDayOfWeek()}, {formatDate()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 floating-card p-3">
              <Flame className="text-accent" size={20} />
              <span className="font-bold text-lg">{stats?.current_streak || 0}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground"
              onClick={() => {
                localStorage.removeItem("brofit_user");
                navigate("/auth");
              }}
            >
              <LogOut size={20} />
            </Button>
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

        <Button 
          variant="glass" 
          size="lg" 
          className="w-full text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
          onClick={() => {
            if (todayWorkout.exercises > 0) {
              const workout = workouts.find(w => w.day_of_week === currentDate.getDay());
              if (workout && workout.exercises.length > 0) {
                navigate('/start-workout', { state: { workout } });
              } else {
                // Se não tem treino específico para hoje, usar qualquer treino disponível
                const availableWorkout = workouts.find(w => w.exercises && w.exercises.length > 0);
                if (availableWorkout) {
                  navigate('/start-workout', { state: { workout: availableWorkout } });
                } else {
                  navigate('/workouts');
                }
              }
            } else {
              navigate('/workouts');
            }
          }}
          disabled={todayWorkout.exercises === 0}
        >
          {todayWorkout.exercises > 0 ? 
            (todayWorkout.completed ? "✅ Treino Concluído" : "🔥 Iniciar Treino") :
            "📝 Criar Treino"
          }
        </Button>
      </div>

      {/* Weekly Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-center mb-2">
            <Target className="text-secondary" size={24} />
          </div>
          <p className="text-2xl font-bold text-secondary">
            {stats?.total_workouts || 0}
          </p>
          <p className="text-muted-foreground text-sm">Total Treinos</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="text-accent" size={24} />
          </div>
          <p className="text-2xl font-bold text-accent">
            {stats?.total_exercises || 0}
          </p>
          <p className="text-muted-foreground text-sm">Exercícios</p>
        </div>


        <div className="stat-card">
          <div className="flex items-center justify-center mb-2">
            <Flame className="text-destructive" size={24} />
          </div>
          <p className="text-2xl font-bold text-destructive">
            {stats?.longest_streak || 0}
          </p>
          <p className="text-muted-foreground text-sm">Recorde</p>
        </div>
      </div>

      {/* Conquistas Widget */}
      <AchievementsWidget />

      {/* Progress Charts */}
      <ProgressCharts />

      {/* Activity Feed */}
      <ActivityFeed />

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-3">Ações Rápidas</h3>
        
        <Button 
          variant="outline" 
          className="w-full justify-start h-14"
          onClick={() => navigate('/progress')}
        >
          <TrendingUp className="mr-3" size={20} />
          Ver Evolução
        </Button>
      </div>

      {/* Motivation Quote */}
      <div className="mt-8 p-6 bg-gradient-accent rounded-2xl text-center">
        <p className="text-accent-foreground font-medium text-lg italic">
          "A diferença entre o impossível e o possível está na determinação."
        </p>
        <p className="text-accent-foreground/80 text-sm mt-2">— Muhammad Ali</p>
      </div>
    </div>
  );
};

export default Dashboard;