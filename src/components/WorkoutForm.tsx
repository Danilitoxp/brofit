import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Workout, WorkoutExercise } from "@/hooks/useWorkouts";

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

export const WorkoutForm = ({ workout, onSubmit, onCancel, isLoading }: WorkoutFormProps) => {
  const [name, setName] = useState(workout?.name || "");
  const [description, setDescription] = useState(workout?.description || "");
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(workout?.day_of_week);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    workout?.exercises || [{ exercise_name: "", sets: 3, reps: 12, weight: 0, exercise_order: 0 }]
  );

  const addExercise = () => {
    setExercises([
      ...exercises,
      { exercise_name: "", sets: 3, reps: 12, weight: 0, exercise_order: exercises.length }
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof WorkoutExercise, value: string | number) => {
    const updatedExercises = [...exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setExercises(updatedExercises);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const validExercises = exercises.filter(ex => ex.exercise_name.trim());
    
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      day_of_week: dayOfWeek,
      exercises: validExercises.map((ex, index) => ({ ...ex, exercise_order: index }))
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
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do treino..."
            rows={3}
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

        <div>
          <div className="flex items-center justify-between mb-4">
            <Label>Exercícios</Label>
            <Button type="button" variant="outline" size="sm" onClick={addExercise}>
              <Plus size={16} className="mr-2" />
              Adicionar Exercício
            </Button>
          </div>

          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <Card key={index} className="p-4 bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-6">
                    <Label htmlFor={`exercise-${index}`}>Nome do Exercício</Label>
                    <Input
                      id={`exercise-${index}`}
                      value={exercise.exercise_name}
                      onChange={(e) => updateExercise(index, "exercise_name", e.target.value)}
                      placeholder="Ex: Supino Reto"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`sets-${index}`}>Séries</Label>
                    <Input
                      id={`sets-${index}`}
                      type="number"
                      min="1"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, "sets", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`reps-${index}`}>Repetições</Label>
                    <Input
                      id={`reps-${index}`}
                      type="number"
                      min="1"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, "reps", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="md:col-span-1">
                    <Label htmlFor={`weight-${index}`}>Peso (kg)</Label>
                    <Input
                      id={`weight-${index}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={exercise.weight}
                      onChange={(e) => updateExercise(index, "weight", parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-center">
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExercise(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || !name.trim()}>
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