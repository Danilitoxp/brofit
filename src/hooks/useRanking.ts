import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ExerciseRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  max_weight: number;
  max_reps: number;
  achieved_at: string;
  profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface RankingEntry {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  max_weight: number;
  max_reps: number;
  achieved_at: string;
  total_score?: number;
  rank: number;
}

export const useRanking = () => {
  const [loading, setLoading] = useState(true);
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Buscar exercícios únicos disponíveis
  const fetchExerciseNames = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_records')
        .select('exercise_name')
        .order('exercise_name');

      if (error) throw error;

      const uniqueExercises = [...new Set(data?.map(record => record.exercise_name) || [])];
      setExerciseNames(uniqueExercises);
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar ranking por exercício específico
  const getExerciseRanking = async (exerciseName: string, limit = 50): Promise<RankingEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('exercise_records')
        .select(`
          user_id,
          max_weight,
          max_reps,
          achieved_at
        `)
        .eq('exercise_name', exerciseName)
        .order('max_weight', { ascending: false })
        .order('max_reps', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get user profiles for the results
      const userIds = data?.map(record => record.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, is_public')
        .in('user_id', userIds)
        .eq('is_public', true);

      // Filter records to only include public profiles
      const publicData = data?.filter(record => 
        profiles?.some(profile => profile.user_id === record.user_id)
      ) || [];

      return publicData?.map((record: any, index) => {
        const profile = profiles?.find(p => p.user_id === record.user_id);
        return {
          user_id: record.user_id,
          display_name: profile?.display_name || 'Usuário',
          avatar_url: profile?.avatar_url,
          max_weight: record.max_weight,
          max_reps: record.max_reps,
          achieved_at: record.achieved_at,
          rank: index + 1
        };
      }) || [];
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o ranking.",
        variant: "destructive"
      });
      return [];
    }
  };

  // Buscar ranking geral (baseado na soma dos pesos máximos)
  const getGeneralRanking = async (limit = 50): Promise<RankingEntry[]> => {
    try {
      // Fallback para ranking simples já que não temos a função RPC
      const { data, error } = await supabase
        .from('exercise_records')
        .select(`
          user_id,
          max_weight
        `);

      if (error) throw error;

      // Get user profiles for the results
      const userIds = [...new Set(data?.map(record => record.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, is_public')
        .in('user_id', userIds)
        .eq('is_public', true);

      // Filter records to only include public profiles
      const publicData = data?.filter(record => 
        profiles?.some(profile => profile.user_id === record.user_id)
      ) || [];

      // Agrupar por usuário e somar pesos
      const userTotals = publicData?.reduce((acc: any, record: any) => {
        const profile = profiles?.find(p => p.user_id === record.user_id);
        if (!acc[record.user_id]) {
          acc[record.user_id] = {
            user_id: record.user_id,
            display_name: profile?.display_name || 'Usuário',
            avatar_url: profile?.avatar_url,
            total_weight: 0
          };
        }
        acc[record.user_id].total_weight += parseFloat(record.max_weight);
        return acc;
      }, {});

      const sortedUsers = Object.values(userTotals || {})
        .sort((a: any, b: any) => b.total_weight - a.total_weight)
        .slice(0, limit);

      return sortedUsers.map((user: any, index) => ({
        user_id: user.user_id,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        max_weight: 0,
        max_reps: 0,
        achieved_at: '',
        total_score: user.total_weight,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Erro ao buscar ranking geral:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o ranking geral.",
        variant: "destructive"
      });
      return [];
    }
  };

  // Buscar ranking dos amigos
  const getFriendsRanking = async (exerciseName?: string): Promise<RankingEntry[]> => {
    if (!user) return [];

    try {
      let query = supabase
        .from('exercise_records')
        .select(`
          user_id,
          exercise_name,
          max_weight,
          max_reps,
          achieved_at
        `);

      // Adicionar filtro por exercício se especificado
      if (exerciseName) {
        query = query.eq('exercise_name', exerciseName);
      }

      // Buscar apenas amigos aceitos
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = friendships?.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      ) || [];

      if (friendIds.length === 0) return [];

      const { data, error } = await query.in('user_id', friendIds);

      if (error) throw error;

      // Get user profiles for the results
      const userIds = [...new Set(data?.map(record => record.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (exerciseName) {
        // Ranking por exercício específico
        return data?.map((record: any, index) => {
          const profile = profiles?.find(p => p.user_id === record.user_id);
          return {
            user_id: record.user_id,
            display_name: profile?.display_name || 'Usuário',
            avatar_url: profile?.avatar_url,
            max_weight: record.max_weight,
            max_reps: record.max_reps,
            achieved_at: record.achieved_at,
            rank: index + 1
          };
        }).sort((a, b) => b.max_weight - a.max_weight) || [];
      } else {
        // Ranking geral dos amigos
        const userTotals = data?.reduce((acc: any, record: any) => {
          const profile = profiles?.find(p => p.user_id === record.user_id);
          if (!acc[record.user_id]) {
            acc[record.user_id] = {
              user_id: record.user_id,
              display_name: profile?.display_name || 'Usuário',
              avatar_url: profile?.avatar_url,
              total_weight: 0
            };
          }
          acc[record.user_id].total_weight += parseFloat(record.max_weight);
          return acc;
        }, {});

        return Object.values(userTotals || {})
          .sort((a: any, b: any) => b.total_weight - a.total_weight)
          .map((user: any, index) => ({
            user_id: user.user_id,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            max_weight: 0,
            max_reps: 0,
            achieved_at: '',
            total_score: user.total_weight,
            rank: index + 1
          }));
      }
    } catch (error) {
      console.error('Erro ao buscar ranking dos amigos:', error);
      return [];
    }
  };

  // Buscar posição do usuário no ranking
  const getUserRankPosition = async (exerciseName?: string): Promise<{ rank: number; total: number } | null> => {
    if (!user) return null;

    try {
      if (exerciseName) {
        const { data, error } = await supabase
          .from('exercise_records')
          .select('user_id, max_weight')
          .eq('exercise_name', exerciseName)
          .order('max_weight', { ascending: false });

        if (error) throw error;

        const userIndex = data?.findIndex(record => record.user_id === user.id);
        return userIndex !== undefined && userIndex !== -1 
          ? { rank: userIndex + 1, total: data?.length || 0 }
          : null;
      } else {
        // Ranking geral - implementar lógica similar
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar posição do usuário:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchExerciseNames();
  }, []);

  return {
    loading,
    exerciseNames,
    getExerciseRanking,
    getGeneralRanking,
    getFriendsRanking,
    getUserRankPosition,
    refetch: fetchExerciseNames
  };
};