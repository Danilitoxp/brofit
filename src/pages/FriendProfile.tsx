import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Calendar, Dumbbell, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FriendProfile {
  user_id: string;
  display_name: string;
  nickname: string;
  bio: string;
  avatar_url: string;
  experience_level: string;
  fitness_goal: string;
  is_public: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned_at: string;
}

interface WorkoutStats {
  total_workouts: number;
  total_weight_lifted: number;
  current_streak: number;
  longest_streak: number;
}

const FriendProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !user) return;

    const fetchFriendData = async () => {
      try {
        // Buscar perfil do amigo
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .eq('is_public', true)
          .single();

        if (profileError) {
          console.error('Error fetching friend profile:', profileError);
          return;
        }

        // Verificar se são amigos
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
          .eq('status', 'accepted')
          .single();

        if (!friendshipData && !profileData.is_public) {
          navigate('/friends');
          return;
        }

        setProfile(profileData);

        // Buscar conquistas
        const { data: achievementsData } = await supabase
          .from('user_achievements')
          .select(`
            *,
            achievements:achievement_id (
              id,
              name,
              description,
              icon,
              category
            )
          `)
          .eq('user_id', userId);

        const formattedAchievements = achievementsData?.map(item => ({
          id: item.achievements.id,
          name: item.achievements.name,
          description: item.achievements.description,
          icon: item.achievements.icon,
          category: item.achievements.category,
          earned_at: item.earned_at
        })) || [];

        setAchievements(formattedAchievements);

        // Buscar estatísticas
        const { data: statsData } = await supabase
          .from('workout_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        setStats(statsData);

      } catch (error) {
        console.error('Error fetching friend data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendData();
  }, [userId, user, navigate]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getExperienceLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return '';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 30) return `${diffInDays} dias atrás`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} meses atrás`;
    return `${Math.floor(diffInDays / 365)} anos atrás`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/friends')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar
          </Button>
          <Card className="floating-card p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Perfil não encontrado</h3>
            <p className="text-muted-foreground">
              Este usuário não existe ou seu perfil é privado.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/friends')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2" size={16} />
          Voltar para Amigos
        </Button>

        {/* Perfil */}
        <Card className="floating-card p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={profile.avatar_url} 
                className="object-cover object-center"
              />
              <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                {getInitials(profile.display_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {profile.display_name}
              </h1>
              {profile.nickname && (
                <p className="text-primary font-medium mb-2">@{profile.nickname}</p>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {profile.experience_level && (
                  <Badge variant="outline">
                    {getExperienceLabel(profile.experience_level)}
                  </Badge>
                )}
                {profile.fitness_goal && (
                  <Badge variant="secondary">
                    {profile.fitness_goal}
                  </Badge>
                )}
              </div>
              {profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="stat-card">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="text-secondary" size={20} />
              </div>
              <p className="text-xl font-bold text-secondary">
                {stats.total_workouts || 0}
              </p>
              <p className="text-muted-foreground text-xs">Treinos</p>
            </Card>

            <Card className="stat-card">
              <div className="flex items-center justify-center mb-2">
                <Dumbbell className="text-accent" size={20} />
              </div>
              <p className="text-xl font-bold text-accent">
                {stats.total_weight_lifted ? `${Math.round(stats.total_weight_lifted / 1000)}K` : '0'}
              </p>
              <p className="text-muted-foreground text-xs">kg Total</p>
            </Card>

            <Card className="stat-card">
              <div className="flex items-center justify-center mb-2">
                <Target className="text-primary" size={20} />
              </div>
              <p className="text-xl font-bold text-primary">
                {stats.current_streak || 0}
              </p>
              <p className="text-muted-foreground text-xs">Sequência</p>
            </Card>

            <Card className="stat-card">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="text-destructive" size={20} />
              </div>
              <p className="text-xl font-bold text-destructive">
                {stats.longest_streak || 0}
              </p>
              <p className="text-muted-foreground text-xs">Recorde</p>
            </Card>
          </div>
        )}

        {/* Conquistas */}
        <Card className="floating-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-primary" size={20} />
            <h2 className="text-xl font-semibold">
              Conquistas ({achievements.length})
            </h2>
          </div>

          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conquista ainda</h3>
              <p className="text-muted-foreground">
                {profile.display_name} ainda não desbloqueou nenhuma conquista.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="p-4 border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {achievement.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(achievement.earned_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FriendProfile;