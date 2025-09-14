import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Play, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useWorkouts, Workout } from "@/hooks/useWorkouts";
import { WorkoutForm } from "@/components/WorkoutForm";
import { useNavigate } from "react-router-dom";
import { getAllExercises } from "@/data/exercises";
const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const Workouts = () => {
  const navigate = useNavigate();
  const {
    workouts,
    loading,
    createWorkout,
    updateWorkout,
    deleteWorkout
  } = useWorkouts();
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exerciseMap, setExerciseMap] = useState<Record<string, string>>({});
  const handleSubmit = async (workout: Workout) => {
    setIsSubmitting(true);
    try {
      if (editingWorkout?.id) {
        await updateWorkout(editingWorkout.id, workout);
      } else {
        await createWorkout(workout);
      }
      setShowForm(false);
      setEditingWorkout(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowForm(true);
  };
  const handleDelete = async (workoutId: string) => {
    await deleteWorkout(workoutId);
  };
  const handleCancel = () => {
    setShowForm(false);
    setEditingWorkout(undefined);
  };
  const startWorkout = (workout: Workout) => {
    navigate('/start-workout', {
      state: {
        workout
      }
    });
  };

  // Carrega catálogo de exercícios (predefinidos + custom) para obter imagem por nome
  useEffect(() => {
    let isMounted = true;
    getAllExercises().then(list => {
      if (!isMounted) return;
      const map: Record<string, string> = {};
      list.forEach(e => {
        if (e.image_url) map[e.name] = e.image_url;
      });
      setExerciseMap(map);
    });
    return () => {
      isMounted = false;
    };
  }, []);
  if (loading) {
    return <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>;
  }
  if (showForm) {
    return <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {editingWorkout ? "Editar Treino" : "Criar Novo Treino"}
            </h1>
            <p className="text-muted-foreground">
              {editingWorkout ? "Faça as alterações necessárias" : "Configure seu treino personalizado"}
            </p>
          </div>

          <WorkoutForm workout={editingWorkout} onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isSubmitting} />
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Meus Treinos</h1>
            
          </div>
          <Button onClick={() => setShowForm(true)} className="hover-scale w-full sm:w-auto">
            <Plus size={20} className="mr-2" />
            Novo Treino
          </Button>
        </div>

        {/* Workouts List */}
        {workouts.length === 0 ? <Card className="floating-card text-center p-8 md:p-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum treino criado</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Comece criando seu primeiro treino personalizado para começar sua jornada fitness
              </p>
              
            </div>
          </Card> : <div className="grid gap-4 md:gap-6">
            {workouts.map(workout => <Card key={workout.id} className="floating-card overflow-hidden hover:scale-[1.01] transition-all duration-300">
                {/* Header Section */}
                <div className="p-4 md:p-6 pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-lg md:text-xl font-bold truncate">{workout.name}</h3>
                        {workout.day_of_week !== undefined && <Badge variant="secondary" className="bg-primary/10 text-primary w-fit">
                            {DAYS_OF_WEEK[workout.day_of_week]}
                          </Badge>}
                      </div>
                      {workout.description && <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{workout.description}</p>}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {workout.exercises.length} exercícios
                        </span>
                        
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => startWorkout(workout)} className="hover:bg-primary hover:text-primary-foreground flex items-center gap-1">
                        <Play size={14} />
                        <span className="hidden sm:inline">Iniciar</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(workout)} className="flex items-center gap-1">
                        <Edit size={14} />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Treino</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o treino "{workout.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => workout.id && handleDelete(workout.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>

                {/* Exercise List */}
                {workout.exercises.length > 0 && <div className="px-4 md:px-6 pb-4 md:pb-6">
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Calendar size={12} />
                        Exercícios ({workout.exercises.length})
                      </h4>
                      <div className="grid gap-2 max-h-48 overflow-y-auto">
                        {workout.exercises.slice(0, 5).map((exercise, index) => <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded-lg text-sm">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <img src={exerciseMap[exercise.exercise_name] || '/placeholder.svg'} alt={`Imagem do exercício ${exercise.exercise_name}`} className="w-10 h-10 rounded-md object-cover bg-muted shrink-0" loading="lazy" />
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                              <span className="font-medium truncate">{exercise.exercise_name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {exercise.sets.length} séries
                            </div>
                          </div>)}
                        {workout.exercises.length > 5 && <div className="text-center py-2">
                            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                              +{workout.exercises.length - 5} exercícios adicionais
                            </span>
                          </div>}
                      </div>
                    </div>
                  </div>}
              </Card>)}
          </div>}
      </div>
    </div>;
};
export default Workouts;