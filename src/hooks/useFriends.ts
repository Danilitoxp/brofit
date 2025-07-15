import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Friend {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  experience_level?: string;
  friendship_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  is_requester: boolean;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_avatar?: string;
  message?: string;
  created_at: string;
}

export interface UserSearchResult {
  user_id: string;
  display_name: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  experience_level?: string;
  friendship_status?: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked';
  is_requester?: boolean;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Buscar amigos e solicitações
  const fetchFriends = async () => {
    if (!user) return;

    try {
      const { data: friendshipsData, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all unique user IDs from friendships
      const allUserIds = [...new Set(friendshipsData?.flatMap(f => [f.requester_id, f.addressee_id]).filter(id => id !== user.id) || [])];
      
      // Get profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, nickname, avatar_url, bio, experience_level')
        .in('user_id', allUserIds);

      const friendsList: Friend[] = [];
      const requestsList: FriendRequest[] = [];

      friendshipsData?.forEach((friendship: any) => {
        const isRequester = friendship.requester_id === user.id;
        const friendUserId = isRequester ? friendship.addressee_id : friendship.requester_id;
        const friendProfile = profiles?.find(p => p.user_id === friendUserId);

        if (friendship.status === 'accepted' && friendProfile) {
          friendsList.push({
            id: friendProfile.user_id,
            user_id: friendProfile.user_id,
            display_name: friendProfile.display_name || 'Usuário',
            avatar_url: friendProfile.avatar_url,
            bio: friendProfile.bio,
            experience_level: friendProfile.experience_level,
            friendship_id: friendship.id,
            status: friendship.status,
            is_requester: isRequester,
            created_at: friendship.created_at
          });
        } else if (friendship.status === 'pending' && !isRequester && friendProfile) {
          // Solicitações recebidas
          requestsList.push({
            id: friendship.id,
            requester_id: friendProfile.user_id,
            requester_name: friendProfile.display_name || 'Usuário',
            requester_avatar: friendProfile.avatar_url,
            created_at: friendship.created_at
          });
        }
      });

      setFriends(friendsList);
      setPendingRequests(requestsList);
    } catch (error) {
      console.error('Erro ao buscar amigos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de amigos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuários
  const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    if (!user || query.length < 2) return [];

    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, nickname, avatar_url, bio, experience_level, is_public')
        .neq('user_id', user.id)
        .eq('is_public', true)
        .or(`nickname.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Buscar status de amizade existente
      const userIds = usersData?.map(u => u.user_id) || [];
      const { data: friendshipsData } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id, status')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      return usersData?.map(userData => {
        const friendship = friendshipsData?.find(f => 
          (f.requester_id === user.id && f.addressee_id === userData.user_id) ||
          (f.addressee_id === user.id && f.requester_id === userData.user_id)
        );

        return {
          user_id: userData.user_id,
          display_name: userData.display_name,
          nickname: userData.nickname,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          experience_level: userData.experience_level,
          friendship_status: (friendship?.status as 'pending' | 'accepted' | 'declined' | 'blocked') || 'none',
          is_requester: friendship ? friendship.requester_id === user.id : false
        };
      }) || [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  };

  // Enviar convite de amizade
  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Convite enviado!",
        description: "Seu convite de amizade foi enviado com sucesso."
      });

      await fetchFriends();
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Erro",
          description: "Já existe uma solicitação de amizade entre vocês.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível enviar o convite de amizade.",
          variant: "destructive"
        });
      }
    }
  };

  // Aceitar convite de amizade
  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Convite aceito!",
        description: "Vocês agora são amigos no BroFit!"
      });

      await fetchFriends();
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o convite.",
        variant: "destructive"
      });
    }
  };

  // Recusar convite de amizade
  const declineFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined' })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Convite recusado",
        description: "O convite de amizade foi recusado."
      });

      await fetchFriends();
    } catch (error) {
      console.error('Erro ao recusar convite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível recusar o convite.",
        variant: "destructive"
      });
    }
  };

  // Remover amigo
  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Amigo removido",
        description: "A amizade foi desfeita."
      });

      await fetchFriends();
    } catch (error) {
      console.error('Erro ao remover amigo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o amigo.",
        variant: "destructive"
      });
    }
  };

  // Cancelar convite enviado
  const cancelFriendRequest = async (addresseeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', user.id)
        .eq('addressee_id', addresseeId)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: "Convite cancelado",
        description: "O convite de amizade foi cancelado."
      });

      await fetchFriends();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o convite.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  return {
    friends,
    pendingRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    cancelFriendRequest,
    refetch: fetchFriends
  };
};