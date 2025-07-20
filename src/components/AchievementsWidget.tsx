import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Star, Target, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_value: number;
  earned_at?: string;
}

export const AchievementsWidget = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Buscar todas as conquistas
        const { data: allAchievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .order('requirement_value', { ascending: true });

        if (achievementsError) throw achievementsError;

        // Buscar conquistas do usuário
        const { data: userAchievementsData, error: userError } = await supabase
          .from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', user.id);

        if (userError) throw userError;

        setAchievements(allAchievements || []);
        setUserAchievements(userAchievementsData?.map(ua => ua.achievement_id) || []);

      } catch (error) {
        console.error('Error fetching achievements:', error);
      }
    };

    fetchData();
  }, [user]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workout': return <Target className="text-secondary" size={20} />;
      case 'strength': return <Zap className="text-accent" size={20} />;
      case 'streak': return <Star className="text-destructive" size={20} />;
      case 'milestone': return <Trophy className="text-primary" size={20} />;
      default: return <Trophy className="text-muted-foreground" size={20} />;
    }
  };

  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <Card className="floating-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Conquistas</h3>
        <div className="text-sm text-muted-foreground">
          {earnedCount}/{totalCount}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.slice(0, 6).map((achievement) => {
          const isEarned = userAchievements.includes(achievement.id);
          
          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                isEarned 
                  ? 'bg-secondary/10 border-secondary/30' 
                  : 'bg-muted/50 border-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{achievement.icon}</span>
                {getCategoryIcon(achievement.category)}
              </div>
              
              <h4 className={`font-medium text-sm ${
                isEarned ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {achievement.name}
              </h4>
              
              <p className={`text-xs ${
                isEarned ? 'text-muted-foreground' : 'text-muted-foreground/70'
              }`}>
                {achievement.description}
              </p>
            </div>
          );
        })}
      </div>

      {totalCount > 6 && (
        <div className="text-center mt-3">
          <p className="text-xs text-muted-foreground">
            +{totalCount - 6} conquistas restantes
          </p>
        </div>
      )}
    </Card>
  );
};