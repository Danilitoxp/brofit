import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CustomExercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  description?: string;
  image_url?: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Verificar se o usuário é admin
  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user.id });

      if (error) throw error;

      setIsAdmin(data || false);
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
      setIsAdmin(false);
    }
  };

  // Buscar exercícios personalizados
  const fetchCustomExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_exercises')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setCustomExercises(data || []);
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os exercícios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar exercício
  const createExercise = async (exercise: Omit<CustomExercise, 'id' | 'created_by' | 'is_active' | 'created_at' | 'updated_at'>) => {
    if (!user || !isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('custom_exercises')
        .insert({
          ...exercise,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Exercício criado com sucesso!"
      });

      await fetchCustomExercises();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar exercício:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o exercício.",
        variant: "destructive"
      });
    }
  };

  // Atualizar exercício
  const updateExercise = async (id: string, updates: Partial<CustomExercise>) => {
    if (!user || !isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('custom_exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Exercício atualizado com sucesso!"
      });

      await fetchCustomExercises();
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar exercício:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o exercício.",
        variant: "destructive"
      });
    }
  };

  // Desativar exercício
  const deactivateExercise = async (id: string) => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('custom_exercises')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Exercício desativado com sucesso!"
      });

      await fetchCustomExercises();
    } catch (error: any) {
      console.error('Erro ao desativar exercício:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível desativar o exercício.",
        variant: "destructive"
      });
    }
  };

  // Upload de imagem do exercício
  const uploadExerciseImage = async (file: File): Promise<string | null> => {
    if (!user || !isAdmin) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `exercises/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('exercise-images')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('exercise-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchCustomExercises();
    }
  }, [user]);

  return {
    isAdmin,
    customExercises,
    loading,
    createExercise,
    updateExercise,
    deactivateExercise,
    uploadExerciseImage,
    refetch: fetchCustomExercises
  };
};