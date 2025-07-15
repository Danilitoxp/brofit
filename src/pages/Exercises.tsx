import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/useAdmin";
import { EXERCISE_CATEGORIES, PREDEFINED_EXERCISES, getAllExercises, Exercise } from "@/data/exercises";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const MUSCLE_GROUPS = [
  'Peitoral', 'Peitoral Superior', 'Peitoral Inferior',
  'Latíssimo', 'Romboides', 'Trapézio',
  'Deltoides', 'Deltoides Anterior', 'Deltoides Medial',
  'Bíceps', 'Tríceps', 'Antebraço',
  'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha',
  'Abdômen', 'Abdômen Inferior', 'Oblíquos', 'Core',
  'Cardio'
];

const Exercises = () => {
  const { customExercises, loading, createExercise, updateExercise, deactivateExercise, uploadExerciseImage } = useAdmin();
  const { toast } = useToast();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    muscle_groups: [] as string[],
    description: '',
    image_url: ''
  });
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Buscar todos os exercícios (predefinidos + customizados)
  const fetchAllExercises = async () => {
    const exercises = await getAllExercises();
    setAllExercises(exercises);
  };

  // Atualizar lista após operações
  const handleCreateSuccess = async (exerciseData: any) => {
    await createExercise(exerciseData);
    await fetchAllExercises();
  };

  const handleUpdateSuccess = async (id: string, exerciseData: any) => {
    await updateExercise(id, exerciseData);
    await fetchAllExercises();
  };

  const handleDeactivateSuccess = async (id: string) => {
    await deactivateExercise(id);
    await fetchAllExercises();
  };

  // Carregar exercícios quando componente monta
  React.useEffect(() => {
    if (!loading) {
      fetchAllExercises();
    }
  }, [loading, customExercises]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || formData.muscle_groups.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    let imageUrl = formData.image_url;

    // Upload da imagem se houver
    if (imageFile) {
      setUploading(true);
      imageUrl = await uploadExerciseImage(imageFile);
      setUploading(false);
      
      if (!imageUrl) return; // Upload falhou
    }

    const exerciseData = {
      ...formData,
      image_url: imageUrl
    };

    if (editingExercise) {
      await handleUpdateSuccess(editingExercise.id, exerciseData);
    } else {
      await handleCreateSuccess(exerciseData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      muscle_groups: [],
      description: '',
      image_url: ''
    });
    setSelectedMuscleGroup('');
    setImageFile(null);
    setEditingExercise(null);
    setShowForm(false);
  };

  const handleEdit = (exercise: any) => {
    setFormData({
      name: exercise.name,
      category: exercise.category,
      muscle_groups: exercise.muscle_groups,
      description: exercise.description || '',
      image_url: exercise.image_url || ''
    });
    setEditingExercise(exercise);
    setShowForm(true);
  };

  const addMuscleGroup = () => {
    if (selectedMuscleGroup && !formData.muscle_groups.includes(selectedMuscleGroup)) {
      setFormData(prev => ({
        ...prev,
        muscle_groups: [...prev.muscle_groups, selectedMuscleGroup]
      }));
      setSelectedMuscleGroup('');
    }
  };

  const removeMuscleGroup = (muscle: string) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.filter(m => m !== muscle)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive"
        });
        return;
      }
      setImageFile(file);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Exercícios</h1>
          <p className="text-muted-foreground">Crie e edite exercícios para os usuários</p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Exercício
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExercise ? 'Editar Exercício' : 'Novo Exercício'}
              </DialogTitle>
              <DialogDescription>
                {editingExercise ? 'Edite as informações do exercício' : 'Preencha as informações do novo exercício'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Exercício *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Supino Reto"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Grupos Musculares *</Label>
                <div className="flex gap-2 mb-2">
                  <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um grupo muscular" />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map((muscle) => (
                        <SelectItem key={muscle} value={muscle}>
                          {muscle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addMuscleGroup} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {formData.muscle_groups.map((muscle) => (
                    <Badge key={muscle} variant="secondary" className="text-xs">
                      {muscle}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => removeMuscleGroup(muscle)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva como executar o exercício..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image">Imagem do Exercício</Label>
                <div className="mt-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    PNG, JPG ou WEBP. Máximo 5MB.
                  </p>
                </div>
                
                {(formData.image_url || imageFile) && (
                  <div className="mt-4">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      {editingExercise ? 'Atualizar' : 'Criar'} Exercício
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allExercises.map((exercise) => (
          <Card key={exercise.id} className="overflow-hidden">
            {exercise.image_url && (
              <div className="aspect-video">
                <img
                  src={exercise.image_url}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  <CardDescription>
                    {EXERCISE_CATEGORIES.find(cat => cat.id === exercise.category)?.name}
                  </CardDescription>
                </div>
                
                <div className="flex gap-1">
                  {exercise.is_custom ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(exercise)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeactivateSuccess(exercise.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Exercício padrão
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Grupos Musculares:</p>
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscle_groups.map((muscle) => (
                      <Badge key={muscle} variant="outline" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {exercise.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Descrição:</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {exercise.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allExercises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum exercício personalizado criado ainda.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Exercício
          </Button>
        </div>
      )}
    </div>
  );
};

export default Exercises;