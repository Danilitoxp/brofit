import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Exercise, EXERCISE_CATEGORIES } from "@/data/exercises";

interface ExerciseEditModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  isLoading?: boolean;
}

export const ExerciseEditModal = ({
  exercise,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}: ExerciseEditModalProps) => {
  const [formData, setFormData] = useState<Exercise>({
    id: '',
    name: '',
    category: 'chest',
    muscle_groups: [],
    description: '',
    image_url: '',
    is_custom: false
  });

  const [newMuscleGroup, setNewMuscleGroup] = useState('');

  useEffect(() => {
    if (exercise) {
      setFormData(exercise);
    }
  }, [exercise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  const addMuscleGroup = () => {
    if (newMuscleGroup.trim() && !formData.muscle_groups.includes(newMuscleGroup.trim())) {
      setFormData(prev => ({
        ...prev,
        muscle_groups: [...prev.muscle_groups, newMuscleGroup.trim()]
      }));
      setNewMuscleGroup('');
    }
  };

  const removeMuscleGroup = (muscleGroup: string) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.filter(mg => mg !== muscleGroup)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMuscleGroup();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {exercise ? 'Editar Exercício' : 'Novo Exercício'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Exercício</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Supino Reto"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXERCISE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Grupos Musculares</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newMuscleGroup}
                onChange={(e) => setNewMuscleGroup(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: Peitoral"
              />
              <Button type="button" onClick={addMuscleGroup} size="sm">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.muscle_groups.map(muscleGroup => (
                <Badge key={muscleGroup} variant="secondary" className="flex items-center gap-1">
                  {muscleGroup}
                  <button
                    type="button"
                    onClick={() => removeMuscleGroup(muscleGroup)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Instruções ou dicas sobre o exercício"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};