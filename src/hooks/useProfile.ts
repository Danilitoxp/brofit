import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id?: string;
  user_id: string;
  display_name?: string;
  nickname?: string;
  bio?: string;
  avatar_url?: string;
  birth_date?: string;
  height?: number;
  weight?: number;
  fitness_goal?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  is_public?: boolean;
  role?: 'user' | 'admin';
}

export interface WorkoutStats {
  id?: string;
  user_id: string;
  total_workouts: number;
  total_exercises: number;
  total_weight_lifted: number;
  current_streak: number;
  longest_streak: number;
  last_workout_date?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Buscar estatísticas
      const { data: statsData, error: statsError } = await supabase
        .from('workout_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }

      setProfile(profileData as Profile);
      setStats(statsData as WorkoutStats);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      // Criar canvas para redimensionar a imagem
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = async () => {
          // Definir tamanho fixo quadrado para evitar distorção
          const size = 400;
          canvas.width = size;
          canvas.height = size;
          
          // Calcular o recorte centralizado
          const aspectRatio = img.width / img.height;
          let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
          
          if (aspectRatio > 1) {
            // Imagem mais larga - recortar nas laterais
            sourceWidth = img.height;
            sourceX = (img.width - img.height) / 2;
          } else if (aspectRatio < 1) {
            // Imagem mais alta - recortar em cima e embaixo
            sourceHeight = img.width;
            sourceY = (img.height - img.width) / 2;
          }
          
          // Desenhar a imagem recortada e redimensionada
          ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size);
          
          // Converter para blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, blob, {
                upsert: true
              });

            if (uploadError) {
              console.error('Error uploading avatar:', uploadError);
              resolve(null);
              return;
            }

            const { data } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);

            resolve(data.publicUrl);
          }, 'image/jpeg', 0.8);
        };
        
        img.onerror = () => {
          console.error('Error loading image');
          resolve(null);
        };
        
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as Profile);
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive"
      });
    }
  };

  const updateStats = async (updates: Partial<WorkoutStats>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('workout_stats')
        .upsert({
          user_id: user.id,
          ...updates
        });

      if (error) throw error;

      await fetchProfile();
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const calculateBMI = (weight?: number, height?: number): number | null => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    stats,
    loading,
    updateProfile,
    updateStats,
    uploadAvatar,
    refetch: fetchProfile,
    calculateAge,
    calculateBMI
  };
};