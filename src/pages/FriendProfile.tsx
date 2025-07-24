import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Target, Star, Zap, Calendar, TrendingUp, Dumbbell, Copy, Share2, Weight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Workout, WorkoutExercise } from '@/hooks/useWorkouts';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  nickname: string;
  bio: string;
  avatar_url: string;
  fitness_goal: string;
  height: number;
  weight: number;
}

interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned_at: string;
}

interface UserStats {
  total_workouts: number;
  total_weight_lifted: number;
  current_streak: number;
  longest_streak: number;
}

export const FriendProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !user) return;

    const fetchUserData = async () => {
      try {
        // Buscar perfil do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) throw profileError;

        // Buscar conquistas do usuário
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('user_achievements')
          .select(`
            achievements (
              id,
              name,
              description,
              icon,
              category
            ),
            earned_at
          `)
          .eq('user_id', userId)
          .order('earned_at', { ascending: false });

        if (achievementsError) throw achievementsError;

        // Buscar estatísticas do usuário
        const { data: statsData, error: statsError } = await supabase
          .from('workout_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (statsError) throw statsError;

        // Buscar treinos com exercícios e séries
        const { data: workoutsData, error: workoutsError } = await supabase
          .from('workouts')
          .select(`
            *,
            workout_exercises!inner (
              id,
              exercise_name,
              exercise_order,
              workout_sets (
                id,
                set_number,
                reps,
                weight,
                completed
              )
            )
          `)
          .eq('user_id', userId)
          .order('day_of_week', { nullsFirst: false });

        if (workoutsError) throw workoutsError;

        // Transformar dados para o formato esperado
        const formattedWorkouts: Workout[] = workoutsData?.map(workout => ({
          id: workout.id,
          name: workout.name,
          description: workout.description,
          day_of_week: workout.day_of_week,
          exercises: workout.workout_exercises
            .sort((a, b) => a.exercise_order - b.exercise_order)
            .map(exercise => ({
              id: exercise.id,
              exercise_name: exercise.exercise_name,
              exercise_order: exercise.exercise_order,
              sets: exercise.workout_sets
                .sort((a, b) => a.set_number - b.set_number)
                .map(set => ({
                  id: set.id,
                  set_number: set.set_number,
                  reps: set.reps,
                  weight: set.weight,
                  completed: set.completed
                }))
            }))
        })) || [];

        setProfile(profileData);
        setAchievements(achievementsData?.map(ua => ({
          id: ua.achievements.id,
          name: ua.achievements.name,
          description: ua.achievements.description,
          icon: ua.achievements.icon,
          category: ua.achievements.category,
          earned_at: ua.earned_at
        })) || []);
        setStats(statsData);
        setWorkouts(formattedWorkouts);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, user]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workout': return <Target className="text-secondary" size={16} />;
      case 'strength': return <Zap className="text-accent" size={16} />;
      case 'streak': return <Star className="text-destructive" size={16} />;
      case 'milestone': return <Trophy className="text-primary" size={16} />;
      default: return <Trophy className="text-muted-foreground" size={16} />;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const copyWorkout = async (workout: Workout) => {
    if (!user) return;

    try {
      // Criar uma cópia do treino para o usuário atual
      const { data: newWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: `${workout.name} (copiado)`,
          description: workout.description
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Copiar exercícios e suas séries
      if (workout.exercises.length > 0) {
        for (const exercise of workout.exercises) {
          const { data: exerciseData, error: exerciseError } = await supabase
            .from('workout_exercises')
            .insert({
              workout_id: newWorkout.id,
              exercise_name: exercise.exercise_name,
              exercise_order: exercise.exercise_order
            })
            .select()
            .single();

          if (exerciseError) throw exerciseError;

          // Criar séries para cada exercício
          if (exercise.sets && exercise.sets.length > 0) {
            const setsToInsert = exercise.sets.map(set => ({
              workout_exercise_id: exerciseData.id,
              set_number: set.set_number,
              reps: set.reps,
              weight: set.weight
            }));

            const { error: setsError } = await supabase
              .from('workout_sets')
              .insert(setsToInsert);

            if (setsError) throw setsError;
          }
        }
      }

      toast({
        title: "Treino copiado!",
        description: `O treino "${workout.name}" foi copiado para seus treinos.`
      });
    } catch (error) {
      console.error('Error copying workout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o treino.",
        variant: "destructive"
      });
    }
  };

  const shareWorkout = (workout: Workout) => {
    const exerciseText = workout.exercises.map(ex => {
      const setsText = ex.sets.map(set => `${set.reps} reps x ${set.weight}kg`).join(', ');
      return `• ${ex.exercise_name}: ${setsText}`;
    }).join('\n');
    
    const workoutText = `Treino: ${workout.name}\n\nExercícios:\n${exerciseText}\n\nCompartilhado do BroFit 💪`;
    
    if (navigator.share) {
      navigator.share({
        title: `Treino: ${workout.name}`,
        text: workoutText
      });
    } else {
      navigator.clipboard.writeText(workoutText);
      toast({
        title: "Treino copiado!",
        description: "O treino foi copiado para a área de transferência."
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usuário não encontrado</h1>
          <Link to="/friends">
            <Button variant="outline">Voltar para Amigos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/friends">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Perfil do Amigo</h1>
      </div>

      {/* Perfil Principal */}
      <Card className="floating-card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center md:items-start">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                {getInitials(profile.display_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold">{profile.display_name}</h2>
              <p className="text-muted-foreground">@{profile.nickname}</p>
            </div>
          </div>

          <div className="flex-1">
            {profile.bio && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Sobre</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {profile.fitness_goal && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Objetivo</h3>
                <p className="text-muted-foreground">{profile.fitness_goal}</p>
              </div>
            )}

            {(profile.height || profile.weight) && (
              <div className="grid grid-cols-2 gap-4">
                {profile.height && (
                  <div>
                    <h4 className="font-medium text-sm">Altura</h4>
                    <p className="text-muted-foreground">{profile.height} cm</p>
                  </div>
                )}
                {profile.weight && (
                  <div>
                    <h4 className="font-medium text-sm">Peso</h4>
                    <p className="text-muted-foreground">{profile.weight} kg</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <Card className="floating-card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Estatísticas
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.total_workouts}</div>
              <div className="text-sm text-muted-foreground">Treinos</div>
            </div>
            
            <div className="text-center p-4 bg-secondary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{Math.round(stats.total_weight_lifted)}kg</div>
              <div className="text-sm text-muted-foreground">Peso Total</div>
            </div>
            
            <div className="text-center p-4 bg-secondary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.current_streak}</div>
              <div className="text-sm text-muted-foreground">Sequência Atual</div>
            </div>
            
            <div className="text-center p-4 bg-secondary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.longest_streak}</div>
              <div className="text-sm text-muted-foreground">Maior Sequência</div>
            </div>
          </div>
        </Card>
      )}

      {/* Conquistas */}
      <Card className="floating-card p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Trophy size={20} />
          Conquistas ({achievements.length})
        </h3>
        
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="p-4 rounded-lg border bg-secondary/5 border-secondary/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{achievement.icon}</span>
                  {getCategoryIcon(achievement.category)}
                </div>
                
                <h4 className="font-medium text-sm mb-1">
                  {achievement.name}
                </h4>
                
                <p className="text-xs text-muted-foreground mb-2">
                  {achievement.description}
                </p>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma conquista ainda</p>
          </div>
        )}
      </Card>

      {/* Treinos */}
      <Card className="floating-card p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Dumbbell size={20} />
          Treinos ({workouts.length})
        </h3>
        
        {workouts.length > 0 ? (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <Card key={workout.id} className="p-4 border border-secondary/20">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{workout.name}</h4>
                    {workout.description && (
                      <p className="text-sm text-muted-foreground">{workout.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyWorkout(workout)}
                    >
                      <Copy size={16} className="mr-1" />
                      Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => shareWorkout(workout)}
                    >
                      <Share2 size={16} className="mr-1" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {workout.exercises.map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-secondary/10 rounded">
                      <div className="flex items-center gap-2">
                        <Weight size={16} className="text-muted-foreground" />
                        <span className="font-medium">{exercise.exercise_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {exercise.sets.length} séries
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Dumbbell size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum treino compartilhado</p>
          </div>
        )}
      </Card>
    </div>
  );
};