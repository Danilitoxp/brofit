import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trophy, Dumbbell, Target, Star, Users } from 'lucide-react';
interface Activity {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  data: any;
  created_at: string;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}
export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    user
  } = useAuth();
  useEffect(() => {
    if (!user) return;
    const fetchActivities = async () => {
      try {
        // Buscar atividades com dados de perfil separadamente
        const {
          data: activitiesData,
          error: activitiesError
        } = await supabase.from('activity_feed').select('*').order('created_at', {
          ascending: false
        }).limit(3);
        if (activitiesError) throw activitiesError;

        // Buscar dados dos perfis dos usuários
        const userIds = [...new Set(activitiesData?.map(a => a.user_id) || [])];
        const {
          data: profilesData,
          error: profilesError
        } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds);
        if (profilesError) throw profilesError;

        // Combinar dados
        const transformedData = activitiesData?.map(activity => {
          const profile = profilesData?.find(p => p.user_id === activity.user_id);
          return {
            ...activity,
            user_profile: {
              display_name: profile?.display_name || 'Usuário',
              avatar_url: profile?.avatar_url
            }
          };
        }) || [];
        setActivities(transformedData);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();

    // Configurar realtime para atualizações
    const subscription = supabase.channel('activity_feed_changes').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activity_feed'
    }, () => {
      fetchActivities(); // Recarregar quando houver nova atividade
    }).subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout_completed':
        return <Dumbbell className="text-secondary" size={16} />;
      case 'achievement_earned':
        return <Trophy className="text-accent" size={16} />;
      case 'record_broken':
        return <Target className="text-destructive" size={16} />;
      case 'streak_milestone':
        return <Star className="text-primary" size={16} />;
      default:
        return <Users className="text-muted-foreground" size={16} />;
    }
  };
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'workout_completed':
        return 'border-l-secondary bg-secondary/5';
      case 'achievement_earned':
        return 'border-l-accent bg-accent/5';
      case 'record_broken':
        return 'border-l-destructive bg-destructive/5';
      case 'streak_milestone':
        return 'border-l-primary bg-primary/5';
      default:
        return 'border-l-muted-foreground bg-muted/5';
    }
  };
  if (loading) {
    return <Card className="floating-card p-4">
        <h3 className="font-semibold text-lg mb-4">Feed de Atividades</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse">
              <div className="h-16 bg-muted rounded-lg"></div>
            </div>)}
        </div>
      </Card>;
  }
  return <Card className="floating-card p-4 mx-0 my-[20px]">
      <h3 className="font-semibold text-lg mb-4">Feed de Atividades</h3>
      
      {activities.length === 0 ? <div className="text-center py-8">
          <Users className="mx-auto text-muted-foreground mb-2" size={32} />
          <p className="text-muted-foreground text-sm">
            Nenhuma atividade recente
          </p>
          <p className="text-muted-foreground/70 text-xs mt-1">
            Complete treinos e adicione amigos para ver atividades aqui
          </p>
        </div> : <div className="space-y-3">
          {activities.map(activity => <div key={activity.id} className={`p-3 rounded-lg border-l-4 ${getActivityColor(activity.type)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {activity.user_id === user?.id ? 'Você' : activity.user_profile?.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-sm text-foreground mb-1">
                    {activity.title}
                  </h4>
                  
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  
                  {activity.data?.icon && <span className="text-lg mt-1 inline-block">
                      {activity.data.icon}
                    </span>}
                </div>
              </div>
            </div>)}
        </div>}
    </Card>;
};