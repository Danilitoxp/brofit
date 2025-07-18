import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search } from "lucide-react";
import { Workout, WorkoutExercise } from "@/hooks/useWorkouts";
import { PREDEFINED_EXERCISES, EXERCISE_CATEGORIES, getExercisesByCategory } from "@/data/exercises";
import { useEffect } from "react";
import { getExercisesByCategory } from "@/data/exercises";

const [allExercises, setAllExercises] = useState<Exercise[]>([]);

useEffect(() => {
  const loadExercises = async () => {
    if (selectedCategory === "all") {
      // Se quiser buscar tudo, cria função getAllExercises
      const allCategories = EXERCISE_CATEGORIES.map(c => c.id);
      const all: Exercise[] = [];

      for (const cat of allCategories) {
        const exs = await getExercisesByCategory(cat);
        all.push(...exs);
      }

      setAllExercises(all);
    } else {
      const exercises = await getExercisesByCategory(selectedCategory);
      setAllExercises(exercises);
    }
  };

  loadExercises();
}, [selectedCategory]);


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

interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
}

interface WorkoutExerciseExtended {
  exercise_name: string;
  exercise_order: number;
  sets: ExerciseSet[];
}

export const WorkoutForm = ({ workout, onSubmit, onCancel, isLoading }: WorkoutFormProps) => {
  const [name, setName] = useState(workout?.name || "");
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(workout?.day_of_week);
  const [exercises, setExercises] = useState<WorkoutExerciseExtended[]>(
    workout?.exercises?.map(ex => ({
      exercise_name: ex.exercise_name,
      exercise_order: ex.exercise_order,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        id: `${i}`,
        reps: ex.reps,
        weight: ex.weight || 0
      }))
    })) || []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
 const filteredExercises = allExercises.filter(exercise => {
  const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
  return matchesSearch;
});


  const addExercise = (exerciseName: string) => {
    setExercises([
      ...exercises,
      {
        exercise_name: exerciseName,
        exercise_order: exercises.length,
        sets: [{ id: '0', reps: 12, weight: 0 }]
      }
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    const newSetId = updatedExercises[exerciseIndex].sets.length.toString();
    updatedExercises[exerciseIndex].sets.push({
      id: newSetId,
      reps: 12,
      weight: 0
    });
    setExercises(updatedExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
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

    const workoutExercises: WorkoutExercise[] = exercises.map((ex, index) => ({
      exercise_name: ex.exercise_name,
      exercise_order: index,
      sets: ex.sets.length,
      reps: Math.round(ex.sets.reduce((acc, set) => acc + set.reps, 0) / ex.sets.length),
      weight: Math.round(ex.sets.reduce((acc, set) => acc + set.weight, 0) / ex.sets.length)
    }));
    
    onSubmit({
      name: name.trim(),
      day_of_week: dayOfWeek,
      exercises: workoutExercises
    });
  };

  return (
    <Card className="floating-card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Nome do Treino</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Peito e Tríceps"
            required
          />
        </div>


        <div>
          <Label htmlFor="day">Dia da Semana (opcional)</Label>
          <Select value={dayOfWeek?.toString()} onValueChange={(value) => setDayOfWeek(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um dia" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((day) => (
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {EXERCISE_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de exercícios disponíveis */}
          <div className="max-h-60 overflow-y-auto mb-4 border rounded-lg p-4 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredExercises.map((exercise) => (
                <Button
                  key={exercise.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => addExercise(exercise.name)}
                  disabled={exercises.some(ex => ex.exercise_name === exercise.name)}
                >
                  <div>
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {exercise.muscle_groups.join(", ")}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercícios Selecionados */}
        {exercises.length > 0 && (
          <div>
            <Label>Exercícios do Treino ({exercises.length})</Label>
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
                      <div key={set.id} className="grid grid-cols-5 gap-3 items-center">
                        <div className="text-sm font-medium text-center">
                          {setIndex + 1}ª
                        </div>
                        
                        <div>
                          <Label className="text-xs">Reps</Label>
                          <Input
                            type="number"
                            min="1"
                            value={set.reps}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 1)}
                            className="h-8"
                          />
                        </div>

                         <div>
                           <Label className="text-xs">Peso (kg)</Label>
                           <Input
                             type="number"
                             min="0"
                             step="0.5"
                             value={set.weight || ''}
                             onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                             className="h-8"
                             placeholder="0"
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