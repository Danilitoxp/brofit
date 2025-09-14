import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ScheduleItem {
  day: number;
  workoutId: string | null;
  isRest: boolean;
}

export const useWorkoutSchedule = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { day: 0, workoutId: null, isRest: true }, // Domingo
    { day: 1, workoutId: null, isRest: false }, // Segunda
    { day: 2, workoutId: null, isRest: false }, // Terça
    { day: 3, workoutId: null, isRest: false }, // Quarta
    { day: 4, workoutId: null, isRest: true }, // Quinta
    { day: 5, workoutId: null, isRest: false }, // Sexta
    { day: 6, workoutId: null, isRest: false }, // Sábado
  ]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSchedule = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week');

      if (error) throw error;

      if (data && data.length > 0) {
        const scheduleMap: Record<number, ScheduleItem> = {};
        
        // Convert database data to schedule format
        data.forEach(item => {
          scheduleMap[item.day_of_week] = {
            day: item.day_of_week,
            workoutId: item.workout_id,
            isRest: item.is_rest
          };
        });

        // Update schedule with saved data
        setSchedule(prev => 
          prev.map(item => scheduleMap[item.day] || item)
        );

        // Set current week from first item (all should have same week)
        if (data[0].current_week !== undefined) {
          setCurrentWeek(data[0].current_week);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cronograma:', error);
      toast({
        title: "Erro ao carregar cronograma",
        description: "Não foi possível carregar seu cronograma.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveScheduleItem = async (dayIndex: number, workoutId: string | null, isRest: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('workout_schedules')
        .upsert({
          user_id: user.id,
          day_of_week: dayIndex,
          workout_id: isRest ? null : workoutId,
          is_rest: isRest,
          current_week: currentWeek
        }, {
          onConflict: 'user_id,day_of_week'
        });

      if (error) throw error;

      // Update local state
      setSchedule(prev => 
        prev.map((item, index) => 
          index === dayIndex 
            ? { ...item, workoutId: isRest ? null : workoutId, isRest }
            : item
        )
      );

      toast({
        title: "Cronograma salvo!",
        description: "Suas alterações foram salvas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar cronograma:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cronograma. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const updateWeek = async (newWeek: number) => {
    if (!user) return;

    try {
      // Update all schedule items with new week
      const updates = schedule.map(item => ({
        user_id: user.id,
        day_of_week: item.day,
        workout_id: item.workoutId,
        is_rest: item.isRest,
        current_week: newWeek
      }));

      const { error } = await supabase
        .from('workout_schedules')
        .upsert(updates, {
          onConflict: 'user_id,day_of_week'
        });

      if (error) throw error;

      setCurrentWeek(newWeek);
      
      toast({
        title: "Semana atualizada!",
        description: `Agora você está na semana ${newWeek + 1} da rotação.`
      });
    } catch (error) {
      console.error('Erro ao atualizar semana:', error);
      toast({
        title: "Erro ao atualizar semana",
        description: "Não foi possível atualizar a semana. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  return {
    schedule,
    currentWeek,
    loading,
    saveScheduleItem,
    updateWeek,
    refetch: fetchSchedule
  };
};