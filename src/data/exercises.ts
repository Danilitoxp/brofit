import { supabase } from '@/integrations/supabase/client';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  description?: string;
  image_url?: string;
  is_custom?: boolean;
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

export const PREDEFINED_EXERCISES: Exercise[] = [
  // Peito
  { id: 'supino-reto', name: 'Supino Reto', category: 'chest', muscle_groups: ['Peitoral', 'Tríceps'] },
  { id: 'supino-inclinado', name: 'Supino Inclinado', category: 'chest', muscle_groups: ['Peitoral Superior', 'Tríceps'] },
  { id: 'supino-declinado', name: 'Supino Declinado', category: 'chest', muscle_groups: ['Peitoral Inferior', 'Tríceps'] },
  { id: 'crucifixo', name: 'Crucifixo', category: 'chest', muscle_groups: ['Peitoral'] },
  { id: 'flexao', name: 'Flexão de Braço', category: 'chest', muscle_groups: ['Peitoral', 'Tríceps'] },
  { id: 'peck-deck', name: 'Peck Deck', category: 'chest', muscle_groups: ['Peitoral'] },

  // Costas
  { id: 'pull-down', name: 'Puxada na Polia', category: 'back', muscle_groups: ['Latíssimo', 'Bíceps'] },
  { id: 'remada-curvada', name: 'Remada Curvada', category: 'back', muscle_groups: ['Latíssimo', 'Romboides'] },
  { id: 'remada-sentada', name: 'Remada Sentada', category: 'back', muscle_groups: ['Latíssimo', 'Romboides'] },
  { id: 'pullover', name: 'Pullover', category: 'back', muscle_groups: ['Latíssimo', 'Peitoral'] },
  { id: 'barra-fixa', name: 'Barra Fixa', category: 'back', muscle_groups: ['Latíssimo', 'Bíceps'] },

  // Ombros
  { id: 'desenvolvimento', name: 'Desenvolvimento com Halteres', category: 'shoulders', muscle_groups: ['Deltoides'] },
  { id: 'elevacao-lateral', name: 'Elevação Lateral', category: 'shoulders', muscle_groups: ['Deltoides Medial'] },
  { id: 'elevacao-frontal', name: 'Elevação Frontal', category: 'shoulders', muscle_groups: ['Deltoides Anterior'] },
  { id: 'desenvolvimento-militar', name: 'Desenvolvimento Militar', category: 'shoulders', muscle_groups: ['Deltoides', 'Tríceps'] },
  { id: 'encolhimento', name: 'Encolhimento', category: 'shoulders', muscle_groups: ['Trapézio'] },

  // Braços
  { id: 'rosca-direta', name: 'Rosca Direta', category: 'arms', muscle_groups: ['Bíceps'] },
  { id: 'rosca-alternada', name: 'Rosca Alternada', category: 'arms', muscle_groups: ['Bíceps'] },
  { id: 'rosca-martelo', name: 'Rosca Martelo', category: 'arms', muscle_groups: ['Bíceps', 'Antebraço'] },
  { id: 'triceps-testa', name: 'Tríceps Testa', category: 'arms', muscle_groups: ['Tríceps'] },
  { id: 'triceps-polia', name: 'Tríceps na Polia', category: 'arms', muscle_groups: ['Tríceps'] },
  { id: 'mergulho', name: 'Mergulho', category: 'arms', muscle_groups: ['Tríceps', 'Peitoral'] },

  // Pernas
  { id: 'agachamento', name: 'Agachamento', category: 'legs', muscle_groups: ['Quadríceps', 'Glúteos'] },
  { id: 'leg-press', name: 'Leg Press', category: 'legs', muscle_groups: ['Quadríceps', 'Glúteos'] },
  { id: 'extensao-quadriceps', name: 'Extensão de Quadríceps', category: 'legs', muscle_groups: ['Quadríceps'] },
  { id: 'flexao-pernas', name: 'Flexão de Pernas', category: 'legs', muscle_groups: ['Posterior'] },
  { id: 'panturrilha-em-pe', name: 'Panturrilha em Pé', category: 'legs', muscle_groups: ['Panturrilha'] },
  { id: 'stiff', name: 'Stiff', category: 'legs', muscle_groups: ['Posterior', 'Glúteos'] },

  // Core
  { id: 'abdominal', name: 'Abdominal', category: 'core', muscle_groups: ['Abdômen'] },
  { id: 'prancha', name: 'Prancha', category: 'core', muscle_groups: ['Core'] },
  { id: 'elevacao-pernas', name: 'Elevação de Pernas', category: 'core', muscle_groups: ['Abdômen Inferior'] },
  { id: 'russian-twist', name: 'Russian Twist', category: 'core', muscle_groups: ['Oblíquos'] },

  // Cardio
  { id: 'esteira', name: 'Esteira', category: 'cardio', muscle_groups: ['Cardio'] },
  { id: 'bicicleta', name: 'Bicicleta Ergométrica', category: 'cardio', muscle_groups: ['Cardio'] },
  { id: 'eliptico', name: 'Elíptico', category: 'cardio', muscle_groups: ['Cardio'] },
];

export const getExercisesByCategory = async (categoryId: string): Promise<Exercise[]> => {
  // Exercícios predefinidos
  const predefined = PREDEFINED_EXERCISES.filter(exercise => exercise.category === categoryId);
  
  // Exercícios customizados do banco
  try {
    const { data: customExercises, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('category', categoryId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Erro ao buscar exercícios customizados:', error);
      return predefined;
    }
    
    const custom: Exercise[] = customExercises?.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      muscle_groups: ex.muscle_groups,
      description: ex.description,
      image_url: ex.image_url,
      is_custom: true
    })) || [];
    
    return [...predefined, ...custom];
  } catch (error) {
    console.error('Erro ao buscar exercícios customizados:', error);
    return predefined;
  }
};

export const getAllExercises = async (): Promise<Exercise[]> => {
  // Exercícios predefinidos
  const predefined = PREDEFINED_EXERCISES;
  
  // Exercícios customizados do banco
  try {
    const { data: customExercises, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('Erro ao buscar exercícios customizados:', error);
      return predefined;
    }
    
    const custom: Exercise[] = customExercises?.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      muscle_groups: ex.muscle_groups,
      description: ex.description,
      image_url: ex.image_url,
      is_custom: true
    })) || [];
    
    return [...predefined, ...custom];
  } catch (error) {
    console.error('Erro ao buscar exercícios customizados:', error);
    return predefined;
  }
};