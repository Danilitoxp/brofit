import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/hooks/useAdmin";
import { EXERCISE_CATEGORIES, getAllExercises, Exercise } from "@/data/exercises";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExerciseEditModal } from "@/components/ExerciseEditModal";
import { Badge } from "@/components/ui/badge";
const Exercises = () => {
  const {
    customExercises,
    loading,
    createExercise,
    updateExercise,
    deactivateExercise,
    uploadExerciseImage
  } = useAdmin();
  const { toast } = useToast();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [uploading, setUploading] = useState(false);

  // Buscar todos os exercícios (predefinidos + customizados)
  const fetchAllExercises = async () => {
    const exercises = await getAllExercises();
    setAllExercises(exercises);
  };

  // Atualizar lista após operações
  const handleCreateSuccess = async (exerciseData: any, imageFile?: File) => {
    let imageUrl = '';

    // Upload da imagem se houver
    if (imageFile) {
      setUploading(true);
      imageUrl = await uploadExerciseImage(imageFile) || '';
      setUploading(false);
      if (!imageUrl && imageFile) return; // Upload falhou
    }

    const finalExerciseData = {
      ...exerciseData,
      image_url: imageUrl
    };

    await createExercise(finalExerciseData);
    await fetchAllExercises();
  };

  const handleUpdateSuccess = async (id: string, exerciseData: any, imageFile?: File) => {
    let imageUrl = exerciseData.image_url;

    // Upload da imagem se houver
    if (imageFile) {
      setUploading(true);
      const newImageUrl = await uploadExerciseImage(imageFile);
      setUploading(false);
      if (newImageUrl) {
        imageUrl = newImageUrl;
      }
    }

    const finalExerciseData = {
      ...exerciseData,
      image_url: imageUrl
    };

    await updateExercise(id, finalExerciseData);
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

  const handleSave = async (exercise: Exercise, imageFile?: File) => {
    if (editingExercise) {
      await handleUpdateSuccess(editingExercise.id, exercise, imageFile);
    } else {
      await handleCreateSuccess(exercise, imageFile);
    }
    handleCloseModal();
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowForm(true);
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setEditingExercise(null);
  };
  if (loading) {
    return <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>;
  }

  return <div className="container mx-auto p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Exercícios</h1>
          <p className="text-muted-foreground">Crie e edite exercícios para os usuários</p>
        </div>
        
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Exercício
        </Button>
      </div>

      <ExerciseEditModal
        exercise={editingExercise}
        isOpen={showForm}
        onClose={handleCloseModal}
        onSave={handleSave}
        isLoading={uploading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allExercises.map(exercise => <Card key={exercise.id} className="overflow-hidden">
            <div className="aspect-video">
                <img src={exercise.image_url || '/placeholder.svg'} alt={exercise.image_url ? exercise.name : `Imagem do exercício ${exercise.name} (ilustrativa)`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  <CardDescription>
                    {EXERCISE_CATEGORIES.find(cat => cat.id === exercise.category)?.name}
                  </CardDescription>
                </div>
                
                <div className="flex gap-1">
                  {exercise.is_custom ? <>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(exercise)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeactivateSuccess(exercise.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </> : <div className="text-xs text-muted-foreground">
                      Exercício padrão
                    </div>}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Grupos Musculares:</p>
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscle_groups.map(muscle => <Badge key={muscle} variant="outline" className="text-xs">
                        {muscle}
                      </Badge>)}
                  </div>
                </div>
                
                {exercise.description && <div>
                    <p className="text-sm font-medium mb-1">Descrição:</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {exercise.description}
                    </p>
                  </div>}
              </div>
            </CardContent>
          </Card>)}
      </div>

      {allExercises.length === 0 && <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum exercício personalizado criado ainda.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Exercício
          </Button>
        </div>}
    </div>;
};
export default Exercises;