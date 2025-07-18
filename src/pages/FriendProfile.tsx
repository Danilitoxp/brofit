import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Target, Star, Zap, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  nickname: string;
  bio: string;
  avatar_url: string;
  experience_level: string;
  fitness_goal: string;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
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
              {profile.experience_level && (
                <Badge variant="secondary" className="mt-2">
                  {profile.experience_level === 'beginner' && 'Iniciante'}
                  {profile.experience_level === 'intermediate' && 'Intermediário'}
                  {profile.experience_level === 'advanced' && 'Avançado'}
                </Badge>
              )}
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
    </div>
  );
};