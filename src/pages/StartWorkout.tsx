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
import { RestTimer } from "@/components/RestTimer";
const StartWorkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const {
    workouts
  } = useWorkouts();
  const {
    stats,
    updateStats
  } = useProfile();
  const {
    user
  } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [lastCompletedSeries, setLastCompletedSeries] = useState<string | null>(null);
  const [restDuration, setRestDuration] = useState(90); // tempo de descanso em segundos

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

  // Estrutura de dados para séries: exerciseIndex-setIndex
  const [seriesData, setSeriesData] = useState(() => {
    const initialData = {};
    exercises.forEach((ex, exIndex) => {
      ex.sets.forEach((set, setIndex) => {
        const key = `${exIndex}-${setIndex}`;
        initialData[key] = {
          weight: '',
          reps: '',
          completed: false
        };
      });
    });
    return initialData;
  });

  // Atualizar seriesData quando os exercícios mudarem
  useEffect(() => {
    if (exercises.length > 0) {
      const newData = {};
      exercises.forEach((ex, exIndex) => {
        ex.sets.forEach((set, setIndex) => {
          const key = `${exIndex}-${setIndex}`;
          // Carrega os dados salvos do set ou inicializa vazio
          newData[key] = {
            weight: set.weight || '',
            reps: set.reps || '',
            completed: false
          };
        });
      });
      setSeriesData(newData);
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
  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const toggleSeries = key => {
    const wasCompleted = seriesData[key]?.completed;
    setSeriesData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        completed: !prev[key].completed
      }
    }));

    // Se estava incompleto e agora está completo, mostrar timer de descanso
    if (!wasCompleted) {
      setLastCompletedSeries(key);
      setShowRestTimer(true);
    }
  };
  const updateWeight = (key, weight) => {
    // Permitir string vazia para poder limpar o campo
    if (weight === '') {
      setSeriesData(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          weight: ''
        }
      }));
      return;
    }
    const weightValue = parseFloat(weight);
    if (!isNaN(weightValue) && weightValue >= 0) {
      setSeriesData(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          weight: weightValue
        }
      }));
    }
  };
  const updateReps = (key, reps) => {
    // Permitir string vazia para poder limpar o campo
    if (reps === '') {
      setSeriesData(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          reps: ''
        }
      }));
      return;
    }
    const repsValue = parseInt(reps);
    if (!isNaN(repsValue) && repsValue >= 1) {
      setSeriesData(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          reps: repsValue
        }
      }));
    }
  };
  const totalSeries = Object.keys(seriesData).length;
  const completedSeries = Object.values(seriesData).filter((series: any) => series.completed).length;

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
    if (completedSeries === 0) return;
    setIsActive(false);
    try {
      // Calcular total de peso levantado no treino
      const totalWeight = Object.entries(seriesData).reduce((total, [key, data]: [string, any]) => {
        if (data.completed && data.weight && data.reps) {
          const weight = typeof data.weight === 'string' ? parseFloat(data.weight) : data.weight;
          const reps = typeof data.reps === 'string' ? parseInt(data.reps) : data.reps;
          if (!isNaN(weight) && !isNaN(reps)) {
            return total + weight * reps;
          }
        }
        return total;
      }, 0);

      // Atualizar registros de exercícios (recordes pessoais) - pegar o melhor de cada exercício
      const exerciseRecords = {};
      Object.entries(seriesData).forEach(([key, data]: [string, any]) => {
        if (data.completed && data.weight && data.reps) {
          const weight = typeof data.weight === 'string' ? parseFloat(data.weight) : data.weight;
          const reps = typeof data.reps === 'string' ? parseInt(data.reps) : data.reps;
          if (!isNaN(weight) && !isNaN(reps)) {
            const [exerciseIndex] = key.split('-');
            const exercise = exercises[parseInt(exerciseIndex)];
            const exerciseName = exercise.exercise_name;
            if (!exerciseRecords[exerciseName] || weight > exerciseRecords[exerciseName].weight || weight === exerciseRecords[exerciseName].weight && reps > exerciseRecords[exerciseName].reps) {
              exerciseRecords[exerciseName] = {
                weight,
                reps
              };
            }
          }
        }
      });

      // Salvar recordes
      for (const [exerciseName, record] of Object.entries(exerciseRecords)) {
        await supabase.rpc('update_exercise_record', {
          p_exercise_name: exerciseName,
          p_weight: (record as any).weight,
          p_reps: (record as any).reps
        });
      }

      // Criar o treino no banco - isso vai disparar o trigger que calcula o streak automaticamente
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          name: `Treino - ${new Date().toLocaleDateString('pt-BR')}`,
          user_id: user.id
        })
        .select()
        .single();

      if (workoutError) {
        console.error('Erro ao criar workout:', workoutError);
        throw workoutError;
      }

      // Verificar conquistas
      await supabase.rpc('check_and_grant_achievements', {
        p_user_id: user?.id
      });

      // Adicionar atividade ao feed
      await supabase.from('activity_feed').insert({
        user_id: user?.id,
        type: 'workout_completed',
        title: 'Treino Concluído!',
        description: `${completedSeries} séries completas em ${formatTime(time)}`,
        data: {
          workout_name: currentWorkout?.name,
          series_completed: completedSeries,
          total_weight: totalWeight,
          duration: time
        }
      });
      toast({
        title: "Treino Finalizado!",
        description: `Parabéns! Você completou ${completedSeries} séries em ${formatTime(time)}. ${totalWeight > 0 ? `Total: ${totalWeight}kg levantados!` : ''}`
      });
      navigate('/');
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      toast({
        title: "Treino Finalizado!",
        description: `Parabéns! Você completou ${completedSeries} séries em ${formatTime(time)}.`
      });
      navigate('/');
    }
  };
  return <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">{currentWorkout?.name || "Treino"}</h1>
          <p className="text-sm text-muted-foreground">
            {completedSeries}/{totalSeries} séries concluídas
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Timer Card */}
      

      {/* Exercise List */}
      <div className="space-y-6">
        {exercises.map((exercise, exerciseIndex) => <Card key={exerciseIndex} className="floating-card p-4">
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-1">{exercise.exercise_name}</h3>
              <p className="text-sm text-muted-foreground">{exercise.sets.length} séries</p>
            </div>
            
            <div className="space-y-3">
              {exercise.sets.map((set, setIndex) => {
            const key = `${exerciseIndex}-${setIndex}`;
            const seriesCompleted = seriesData[key]?.completed;
            return <div key={setIndex} className={`p-3 rounded-lg border transition-all duration-300 ${seriesCompleted ? 'bg-secondary/10 border-secondary/30' : 'bg-card border-border hover:border-primary/20'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => toggleSeries(key)} className={`w-6 h-6 rounded-full border-2 ${seriesCompleted ? 'bg-secondary border-secondary text-secondary-foreground' : 'border-muted-foreground'}`}>
                          {seriesCompleted && <Check size={12} />}
                        </Button>
                        <span className={`font-medium ${seriesCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          Série {setIndex + 1}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Peso (kg)</label>
                        <Input type="text" value={seriesData[key]?.weight ?? ''} onChange={e => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      updateWeight(key, value);
                    }
                  }} className="mt-1" placeholder="Peso (kg)" disabled={seriesCompleted} inputMode="decimal" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Repetições</label>
                        <Input type="text" value={seriesData[key]?.reps ?? ''} onChange={e => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      updateReps(key, value);
                    }
                  }} className="mt-1" placeholder="Repetições" disabled={seriesCompleted} inputMode="numeric" />
                      </div>
                    </div>
                  </div>;
          })}
            </div>
          </Card>)}
      </div>

      {/* Finish Workout Button */}
      <div className="mt-8">
        <Button variant="secondary" size="lg" className="w-full h-14" disabled={completedSeries === 0} onClick={finishWorkout}>
          <Check className="mr-2" size={20} />
          Finalizar Treino ({completedSeries}/{totalSeries})
        </Button>
      </div>

      {/* Rest Duration Selector */}
      <Card className="floating-card p-4 mt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tempo de descanso:</span>
          <div className="flex gap-2">
            {[60, 90, 120, 180].map(duration => <Button key={duration} variant={restDuration === duration ? "secondary" : "outline"} size="sm" onClick={() => setRestDuration(duration)} className="px-3 py-1 text-xs">
                {duration < 120 ? `${duration}s` : `${duration / 60}min`}
              </Button>)}
          </div>
        </div>
      </Card>

      {/* Rest Timer */}
      <RestTimer isVisible={showRestTimer} onClose={() => setShowRestTimer(false)} onComplete={() => setShowRestTimer(false)} duration={restDuration} />
    </div>;
};
export default StartWorkout;