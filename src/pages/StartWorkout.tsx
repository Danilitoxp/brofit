import { useState, useEffect } from "react";
import { ArrowLeft, Play, Plus, Timer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const StartWorkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { workouts } = useWorkouts();
  const { stats, updateStats } = useProfile();
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);

  // Buscar o treino - pode vir do state ou buscar o treino de hoje
  const getWorkout = () => {
    if (location.state?.workout) {
      return location.state.workout;
    }
    
    // Se não tem workout no state, buscar treino de hoje
    const today = new Date().getDay(); // 0 = domingo, 1 = segunda, etc.
    const todayWorkout = workouts.find(w => w.day_of_week === today);
    
    // Se não encontrou treino de hoje, retornar o primeiro treino disponível
    if (!todayWorkout && workouts.length > 0) {
      return workouts[0];
    }
    
    return todayWorkout || null;
  };

  const currentWorkout = getWorkout();
  const exercises = currentWorkout?.exercises || [];

  const [exerciseData, setExerciseData] = useState(
    exercises.reduce((acc, ex, index) => ({
      ...acc,
      [index]: { weight: ex.weight || 0, reps: ex.reps, completed: false }
    }), {})
  );

  // Atualizar exerciseData quando os exercícios mudarem
  useEffect(() => {
    if (exercises.length > 0) {
      setExerciseData(
        exercises.reduce((acc, ex, index) => ({
          ...acc,
          [index]: { weight: ex.weight || 0, reps: ex.reps, completed: false }
        }), {})
      );
    }
  }, [exercises]);

  // Redirecionar se não há treino
  useEffect(() => {
    if (!currentWorkout) {
      toast({
        title: "Nenhum treino encontrado",
        description: "Crie um treino primeiro para começar.",
        variant: "destructive"
      });
      navigate('/workouts');
      return;
    }
    
    if (!exercises || exercises.length === 0) {
      toast({
        title: "Treino sem exercícios",
        description: "Adicione exercícios ao treino para poder iniciá-lo.",
        variant: "destructive"
      });
      navigate('/workouts');
    }
  }, [currentWorkout, exercises, navigate, toast]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExercise = (id) => {
    setExerciseData(prev => ({
      ...prev,
      [id]: { ...prev[id], completed: !prev[id].completed }
    }));
  };

  const updateWeight = (id, weight) => {
    setExerciseData(prev => ({
      ...prev,
      [id]: { ...prev[id], weight: parseInt(weight) || 0 }
    }));
  };

  const updateReps = (id, reps) => {
    setExerciseData(prev => ({
      ...prev,
      [id]: { ...prev[id], reps: parseInt(reps) || 0 }
    }));
  };

  const completedCount = Object.values(exerciseData).filter((ex: any) => ex.completed).length;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    } else if (!isActive && time !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time]);

  const finishWorkout = async () => {
    if (completedCount === 0) return;
    
    setIsActive(false);
    
    try {
      // Calcular total de peso levantado no treino
      const totalWeight = Object.entries(exerciseData).reduce((total, [index, data]: [string, any]) => {
        if (data.completed && data.weight && data.reps) {
          const exercise = exercises[parseInt(index)];
          return total + (data.weight * data.reps * exercise.sets);
        }
        return total;
      }, 0);

      // Atualizar registros de exercícios (recordes pessoais)
      for (const [index, data] of Object.entries(exerciseData)) {
        if ((data as any).completed && (data as any).weight && (data as any).reps) {
          const exercise = exercises[parseInt(index)];
          await supabase.rpc('update_exercise_record', {
            p_exercise_name: exercise.exercise_name,
            p_weight: (data as any).weight,
            p_reps: (data as any).reps
          });
        }
      }

      // Calcular nova sequência
      const today = new Date().toISOString().split('T')[0];
      const lastWorkoutDate = stats?.last_workout_date;
      let newStreak = 1;
      
      if (lastWorkoutDate) {
        const lastDate = new Date(lastWorkoutDate);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Treino em dias consecutivos
          newStreak = (stats?.current_streak || 0) + 1;
        } else if (diffDays === 0) {
          // Mesmo dia, manter sequência
          newStreak = stats?.current_streak || 1;
        }
        // Se mais de 1 dia, sequência quebra (newStreak = 1)
      }

      // Atualizar estatísticas
      await updateStats({
        total_workouts: (stats?.total_workouts || 0) + 1,
        total_exercises: (stats?.total_exercises || 0) + completedCount,
        total_weight_lifted: (stats?.total_weight_lifted || 0) + totalWeight,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, stats?.longest_streak || 0),
        last_workout_date: today
      });

      toast({
        title: "Treino Finalizado!",
        description: `Parabéns! Você completou ${completedCount} exercícios em ${formatTime(time)}. ${totalWeight > 0 ? `Total: ${totalWeight}kg levantados!` : ''}`,
      });
      
      navigate('/');
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      toast({
        title: "Treino Finalizado!",
        description: `Parabéns! Você completou ${completedCount} exercícios em ${formatTime(time)}.`,
      });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">{currentWorkout?.name || "Treino"}</h1>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{exercises.length} concluídos
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Timer Card */}
      <Card className="floating-card mb-6 bg-gradient-primary p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-foreground">
              Tempo de Treino
            </h2>
            <p className="text-3xl font-mono font-bold text-primary-foreground">
              {formatTime(time)}
            </p>
          </div>
          <Button 
            variant="glass"
            size="lg"
            onClick={() => setIsActive(!isActive)}
            className="text-primary-foreground border-primary-foreground/20"
          >
            {isActive ? <Timer size={20} /> : <Play size={20} />}
            {isActive ? "Pausar" : "Iniciar"}
          </Button>
        </div>
        
        <div className="w-full bg-primary-foreground/20 rounded-full h-2">
          <div 
            className="bg-secondary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / exercises.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Exercise List */}
      <div className="space-y-4">
        {exercises.map((exercise, index) => (
          <Card 
            key={index}
            className={`floating-card p-4 transition-all duration-300 ${
              exerciseData[index]?.completed 
                ? 'bg-secondary/10 border-secondary/30' 
                : 'hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleExercise(index)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    exerciseData[index]?.completed
                      ? 'bg-secondary border-secondary text-secondary-foreground'
                      : 'border-muted-foreground'
                  }`}
                >
                  {exerciseData[index]?.completed && <Check size={12} />}
                </Button>
                <div>
                  <h3 className={`font-semibold ${
                    exerciseData[index]?.completed ? 'line-through text-muted-foreground' : ''
                  }`}>
                    {exercise.exercise_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {exercise.sets} séries
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Peso (kg)</label>
                <Input
                  type="number"
                  value={exerciseData[index]?.weight || ''}
                  onChange={(e) => updateWeight(index, e.target.value)}
                  className="mt-1"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Repetições</label>
                <Input
                  type="number"
                  value={exerciseData[index]?.reps || ''}
                  onChange={(e) => updateReps(index, e.target.value)}
                  className="mt-1"
                  placeholder="0"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Finish Workout Button */}
      <div className="mt-8">
        <Button 
          variant="secondary" 
          size="lg"
          className="w-full h-14"
          disabled={completedCount === 0}
          onClick={finishWorkout}
        >
          <Check className="mr-2" size={20} />
          Finalizar Treino ({completedCount}/{exercises.length})
        </Button>
      </div>
    </div>
  );
};

export default StartWorkout;