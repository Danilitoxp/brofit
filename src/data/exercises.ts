import { supabase } from '@/integrations/supabase/client';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  description?: string;
  image_url?: string;
}

export const EXERCISE_CATEGORIES = [
  { id: 'chest', name: 'Peito' },
  { id: 'back', name: 'Costas' },
  { id: 'shoulders', name: 'Ombros' },
  { id: 'arms', name: 'Braços' },
  { id: 'legs', name: 'Pernas' },
  { id: 'core', name: 'Core/Abdômen' },
  { id: 'cardio', name: 'Cardio' },
];

export let PREDEFINED_EXERCISES: Exercise[] = [];

export const updatePredefinedExercise = (id: string, updates: Partial<Exercise>) => {
  const index = PREDEFINED_EXERCISES.findIndex(ex => ex.id === id);
  if (index !== -1) {
    PREDEFINED_EXERCISES[index] = { ...PREDEFINED_EXERCISES[index], ...updates };
  }
};

export const getExercisesByCategory = async (categoryId: string): Promise<Exercise[]> => {
  // Apenas exercícios customizados do banco
  try {
    const { data: customExercises, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('category', categoryId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Erro ao buscar exercícios customizados:', error);
      return [];
    }
    
    const custom: Exercise[] = customExercises?.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      muscle_groups: ex.muscle_groups,
      description: ex.description,
      image_url: ex.image_url
    })) || [];
    
    return custom;
  } catch (error) {
    console.error('Erro ao buscar exercícios customizados:', error);
    return [];
  }
};

export const getAllExercises = async (): Promise<Exercise[]> => {
  // Apenas exercícios customizados do banco
  try {
    const { data: customExercises, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('Erro ao buscar exercícios customizados:', error);
      return [];
    }
    
    const custom: Exercise[] = customExercises?.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      muscle_groups: ex.muscle_groups,
      description: ex.description,
      image_url: ex.image_url
    })) || [];
    
    return custom;
  } catch (error) {
    console.error('Erro ao buscar exercícios customizados:', error);
    return [];
  }
};