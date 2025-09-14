import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, RotateCcw, Play, Plus } from "lucide-react";
import { Workout } from "@/hooks/useWorkouts";

interface WorkoutSchedulerProps {
  workouts: Workout[];
  onStartWorkout: (workout: Workout) => void;
}

const DAYS_OF_WEEK = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
];

interface ScheduleItem {
  day: number;
  workoutId: string | null;
  isRest: boolean;
}

export const WorkoutScheduler = ({ workouts, onStartWorkout }: WorkoutSchedulerProps) => {
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduleItem[]>([
    { day: 0, workoutId: null, isRest: true }, // Domingo
    { day: 1, workoutId: null, isRest: false }, // Segunda
    { day: 2, workoutId: null, isRest: false }, // Terça
    { day: 3, workoutId: null, isRest: false }, // Quarta
    { day: 4, workoutId: null, isRest: true }, // Quinta
    { day: 5, workoutId: null, isRest: false }, // Sexta
    { day: 6, workoutId: null, isRest: false }, // Sábado
  ]);
  
  const [currentWeek, setCurrentWeek] = useState(0);

  const updateScheduleItem = (dayIndex: number, workoutId: string | null, isRest: boolean) => {
    setWeeklySchedule(prev => 
      prev.map((item, index) => 
        index === dayIndex 
          ? { ...item, workoutId: isRest ? null : workoutId, isRest }
          : item
      )
    );
  };

  const getTodayWorkout = () => {
    const today = new Date().getDay();
    const totalWorkoutDays = weeklySchedule.filter(item => !item.isRest).length;
    
    if (totalWorkoutDays === 0) return null;

    // Calcular o índice do treino baseado na semana atual e no dia
    const workoutDays = weeklySchedule
      .map((item, index) => ({ ...item, originalDay: index }))
      .filter(item => !item.isRest);
    
    const todaySchedule = weeklySchedule[today];
    if (todaySchedule.isRest) return null;

    const todayWorkoutIndex = workoutDays.findIndex(item => item.originalDay === today);
    if (todayWorkoutIndex === -1) return null;

    // Rotação baseada na semana
    const rotatedIndex = (todayWorkoutIndex + currentWeek) % totalWorkoutDays;
    const selectedWorkoutDay = workoutDays[rotatedIndex];
    
    if (selectedWorkoutDay.workoutId) {
      return workouts.find(w => w.id === selectedWorkoutDay.workoutId);
    }

    return null;
  };

  const getWorkoutForDay = (dayIndex: number) => {
    const daySchedule = weeklySchedule[dayIndex];
    if (daySchedule.isRest) return null;

    const workoutDays = weeklySchedule
      .map((item, index) => ({ ...item, originalDay: index }))
      .filter(item => !item.isRest);
    
    const dayWorkoutIndex = workoutDays.findIndex(item => item.originalDay === dayIndex);
    if (dayWorkoutIndex === -1) return null;

    const totalWorkoutDays = workoutDays.length;
    if (totalWorkoutDays === 0) return null;

    const rotatedIndex = (dayWorkoutIndex + currentWeek) % totalWorkoutDays;
    const selectedWorkoutDay = workoutDays[rotatedIndex];
    
    if (selectedWorkoutDay.workoutId) {
      return workouts.find(w => w.id === selectedWorkoutDay.workoutId);
    }

    return null;
  };

  const todayWorkout = getTodayWorkout();
  const today = new Date().getDay();

  return (
    <div className="space-y-6">
      {/* Treino de Hoje */}
      <Card className="floating-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold">Treino de Hoje</h3>
              <p className="text-sm text-muted-foreground">{DAYS_OF_WEEK[today]}</p>
            </div>
          </div>
          <Badge variant="secondary">Semana {currentWeek + 1}</Badge>
        </div>

        {todayWorkout ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">{todayWorkout.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {todayWorkout.exercises.length} exercícios programados
              </p>
              <Button onClick={() => onStartWorkout(todayWorkout)} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Iniciar Treino
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">
              {weeklySchedule[today].isRest ? "Dia de descanso" : "Nenhum treino programado"}
            </p>
            <p className="text-sm text-muted-foreground">
              Configure seu cronograma semanal abaixo
            </p>
          </div>
        )}
      </Card>

      {/* Configuração do Cronograma */}
      <Card className="floating-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Cronograma Semanal</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(prev => prev + 1)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Próxima Semana
          </Button>
        </div>

        <div className="grid gap-4">
          {weeklySchedule.map((scheduleItem, index) => {
            const isToday = index === today;
            const dayWorkout = getWorkoutForDay(index);
            
            return (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  isToday ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{DAYS_OF_WEEK[index]}</span>
                    {isToday && <Badge variant="default">Hoje</Badge>}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Descanso:</Label>
                    <input
                      type="checkbox"
                      checked={scheduleItem.isRest}
                      onChange={(e) => updateScheduleItem(index, null, e.target.checked)}
                      className="rounded"
                    />
                  </div>
                </div>

                {!scheduleItem.isRest && (
                  <Select
                    value={scheduleItem.workoutId || ""}
                    onValueChange={(value) => updateScheduleItem(index, value || null, false)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um treino" />
                    </SelectTrigger>
                    <SelectContent>
                      {workouts.map(workout => (
                        <SelectItem key={workout.id} value={workout.id!}>
                          {workout.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {dayWorkout && (
                  <div className="mt-3 p-3 bg-muted/30 rounded text-sm">
                    <span className="font-medium">Rotação: {dayWorkout.name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({dayWorkout.exercises.length} exercícios)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Como funciona a rotação?
          </h4>
          <p className="text-sm text-muted-foreground">
            Configure qual treino acontece em cada dia da semana. A cada semana, 
            os treinos vão rotacionar automaticamente. Por exemplo: Se você treina 
            4x na semana (A, B, C, D), na próxima semana será (B, C, D, A).
          </p>
        </div>
      </Card>
    </div>
  );
};