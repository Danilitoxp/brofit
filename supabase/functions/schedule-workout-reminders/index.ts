import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting workout reminder job...');

    // Buscar usuários que não treinaram hoje
    const today = new Date().toISOString().split('T')[0];
    
    const { data: usersToRemind, error: usersError } = await supabase
      .from('workout_stats')
      .select('user_id, last_workout_date')
      .or(`last_workout_date.is.null,last_workout_date.lt.${today}`);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!usersToRemind || usersToRemind.length === 0) {
      console.log('No users need workout reminders');
      return new Response(
        JSON.stringify({ message: 'No users need reminders' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${usersToRemind.length} users who need workout reminders`);

    // Buscar treinos programados para hoje (dia da semana)
    const dayOfWeek = new Date().getDay(); // 0 = domingo, 1 = segunda, etc.
    
    const { data: scheduledWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('user_id, name')
      .eq('day_of_week', dayOfWeek);

    if (workoutsError) {
      console.error('Error fetching scheduled workouts:', workoutsError);
    }

    const workoutMap = new Map(
      scheduledWorkouts?.map(w => [w.user_id, w.name]) || []
    );

    // Enviar lembretes para cada usuário
    const reminderPromises = usersToRemind.map(async (user) => {
      try {
        const workoutName = workoutMap.get(user.user_id);
        
        let title, body;
        if (workoutName) {
          title = `Hora do ${workoutName}! 💪`;
          body = `Hoje é dia de ${workoutName.toLowerCase()}. Bora treinar?`;
        } else {
          title = 'Hora de treinar! 🏋️‍♂️';
          body = 'Você ainda não treinou hoje. Que tal dar uma passada na academia?';
        }

        // Chamar edge function de envio de push notification
        const response = await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: user.user_id,
            title,
            body,
            data: {
              type: 'workout_reminder',
              workout_name: workoutName || null
            },
            tag: 'workout-reminder',
            actions: [
              {
                action: 'start_workout',
                title: 'Iniciar Treino'
              },
              {
                action: 'dismiss',
                title: 'Mais tarde'
              }
            ]
          }
        });

        if (response.error) {
          console.error(`Error sending reminder to ${user.user_id}:`, response.error);
          return { user_id: user.user_id, success: false, error: response.error };
        }

        console.log(`Sent workout reminder to ${user.user_id}`);
        return { user_id: user.user_id, success: true };

      } catch (error) {
        console.error(`Error processing reminder for ${user.user_id}:`, error);
        return { user_id: user.user_id, success: false, error: error.message };
      }
    });

    const results = await Promise.all(reminderPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Sent workout reminders to ${successCount}/${results.length} users`);

    return new Response(
      JSON.stringify({
        message: `Sent workout reminders to ${successCount}/${results.length} users`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-workout-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});