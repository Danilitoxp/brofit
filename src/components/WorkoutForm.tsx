import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Workout, WorkoutExercise, WorkoutSet } from "@/hooks/useWorkouts";
import { PREDEFINED_EXERCISES, EXERCISE_CATEGORIES } from "@/data/exercises";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/data/exercises";

interface WorkoutFormProps {
  workout?: Workout;
  onSubmit: (workout: Workout) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" }
];

export const WorkoutForm = ({
  workout,
  onSubmit,
  onCancel,
  isLoading
}: WorkoutFormProps) => {
  const [name, setName] = useState(workout?.name || "");
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(workout?.day_of_week);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(workout?.exercises || []);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Busca apenas os exercícios personalizados
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  useEffect(() => {
    const fetchCustomExercises = async () => {
      const { data, error } = await supabase
        .from('custom_exercises')
        .select('*')
        .eq('is_active', true);
      if (!error && data) {
        const formatted = data.map(item => ({
          ...item,
          muscle_groups: item.muscle_groups || []
        }));
        setCustomExercises(formatted);
      }
    };
    fetchCustomExercises();
  }, []);

  // Usar apenas exercícios customizados
  const allExercises = customExercises;
  const filteredExercises = allExercises.filter(exercise => {
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addExercise = (exerciseName: string) => {
    const newExercise: WorkoutExercise = {
      exercise_name: exerciseName,
      exercise_order: exercises.length,
      sets: [{
        set_number: 1,
        reps: 12,
        weight: 0
      }]
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    const newSetNumber = updatedExercises[exerciseIndex].sets.length + 1;
    updatedExercises[exerciseIndex].sets.push({
      set_number: newSetNumber,
      reps: 12,
      weight: 0
    });
    setExercises(updatedExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    // Renumerar as séries
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.map((set, index) => ({
      ...set,
      set_number: index + 1
    }));
    setExercises(updatedExercises);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updatedExercises);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || exercises.length === 0) return;

    const workoutData: Workout = {
      name: name.trim(),
      day_of_week: dayOfWeek,
      exercises: exercises.map((ex, index) => ({
        ...ex,
        exercise_order: index
      }))
    };

    onSubmit(workoutData);
  };

  return (
    <Card className="floating-card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Nome do Treino</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Ex: Peito e Tríceps" 
            required 
          />
        </div>

        <div>
          <Label htmlFor="day">Dia da Semana (opcional)</Label>
          <Select value={dayOfWeek?.toString()} onValueChange={value => setDayOfWeek(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um dia" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map(day => (
                <SelectItem key={day.value} value={day.value.toString()}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seleção de Exercícios */}
        <div>
          <Label>Buscar e Adicionar Exercícios</Label>
          
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Input 
                placeholder="Buscar exercício..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full" 
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {EXERCISE_CATEGORIES.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de exercícios disponíveis */}
          <div className="max-h-60 overflow-y-auto mb-4 border rounded-lg p-4 bg-muted/30">
            {filteredExercises.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Nenhum exercício encontrado.</p>
                <p className="text-sm">Crie exercícios personalizados primeiro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredExercises.map(exercise => (
                  <Button 
                    key={exercise.id} 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="justify-start h-auto p-3 text-left" 
                    onClick={() => addExercise(exercise.name)} 
                    disabled={exercises.some(ex => ex.exercise_name === exercise.name)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {exercise.image_url && (
                        <img 
                          src={exercise.image_url} 
                          alt={exercise.name}
                          className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{exercise.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {EXERCISE_CATEGORIES.find(cat => cat.id === exercise.category)?.name || exercise.category}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exercícios Selecionados */}
        {exercises.length > 0 && (
          <div>
            <div className="space-y-4">
              {exercises.map((exercise, exerciseIndex) => (
                <Card key={exerciseIndex} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{exercise.exercise_name}</h4>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeExercise(exerciseIndex)} 
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Séries ({exercise.sets.length})</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addSet(exerciseIndex)}
                      >
                        <Plus size={14} className="mr-1" />
                        Série
                      </Button>
                    </div>

                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-5 gap-3 items-center">
                        <div className="text-sm font-medium text-center">
                          {setIndex + 1}ª
                        </div>
                        
                        <div>
                          <Label className="text-xs">Reps</Label>
                          <Input 
                            type="text" 
                            value={set.reps} 
                            onChange={e => {
                              const value = e.target.value;
                              if (value === '' || /^\d+$/.test(value)) {
                                updateSet(exerciseIndex, setIndex, 'reps', value === '' ? 0 : parseInt(value));
                              }
                            }} 
                            className="h-8" 
                            inputMode="numeric"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Peso (kg)</Label>
                          <Input 
                            type="text" 
                            value={set.weight || ''} 
                            onChange={e => {
                              const value = e.target.value;
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                updateSet(exerciseIndex, setIndex, 'weight', value === '' ? 0 : parseFloat(value));
                              }
                            }} 
                            className="h-8" 
                            placeholder="0" 
                            inputMode="decimal"
                          />
                        </div>

                        <div className="text-center">
                          {exercise.sets.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeSet(exerciseIndex, setIndex)} 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || !name.trim() || exercises.length === 0}>
            {workout ? "Atualizar Treino" : "Criar Treino"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
};