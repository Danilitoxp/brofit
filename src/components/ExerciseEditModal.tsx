import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload } from "lucide-react";
import { Exercise, EXERCISE_CATEGORIES } from "@/data/exercises";
import { useToast } from "@/hooks/use-toast";

interface ExerciseEditModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise, imageFile?: File) => void;
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
    image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (exercise) {
      setFormData(exercise);
    }
  }, [exercise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData, imageFile || undefined);
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar se é imagem ou GIF
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Erro",
          description: "Apenas arquivos de imagem (JPG, PNG, GIF, WebP) são permitidos.",
          variant: "destructive"
        });
        return;
      }

      // Verificar tamanho máximo (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Erro",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
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
            <Label htmlFor="image">Imagem (opcional)</Label>
            <div className="space-y-2">
              <Input
                id="image"
                type="file"
                accept="image/*,.gif"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Formatos suportados: JPG, PNG, GIF, WebP. Máximo: 5MB
              </p>
              {imageFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{imageFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageFile(null)}
                    className="ml-auto h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {formData.image_url && !imageFile && (
                <div className="aspect-video max-w-48 rounded-md overflow-hidden">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
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