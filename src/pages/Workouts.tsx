import { useState } from "react";
import { Plus, Edit, Trash2, Play, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useWorkouts, Workout } from "@/hooks/useWorkouts";
import { WorkoutForm } from "@/components/WorkoutForm";
import { useNavigate } from "react-router-dom";

const DAYS_OF_WEEK = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
];

const Workouts = () => {
  const navigate = useNavigate();
  const { workouts, loading, createWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    navigate('/start-workout', { state: { workout } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {editingWorkout ? "Editar Treino" : "Criar Novo Treino"}
            </h1>
            <p className="text-muted-foreground">
              {editingWorkout ? "Faça as alterações necessárias" : "Configure seu treino personalizado"}
            </p>
          </div>

          <WorkoutForm
            workout={editingWorkout}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meus Treinos</h1>
            <p className="text-muted-foreground">
              Gerencie sua rotina de treinos semanal
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="hover-scale">
            <Plus size={20} className="mr-2" />
            Novo Treino
          </Button>
        </div>

        {/* Workouts List */}
        {workouts.length === 0 ? (
          <Card className="floating-card text-center p-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum treino criado</h3>
              <p className="text-muted-foreground mb-6">
                Comece criando seu primeiro treino personalizado
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus size={20} className="mr-2" />
                Criar Primeiro Treino
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {workouts.map((workout) => (
              <Card key={workout.id} className="floating-card p-6 hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{workout.name}</h3>
                      {workout.day_of_week !== undefined && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {DAYS_OF_WEEK[workout.day_of_week]}
                        </Badge>
                      )}
                    </div>
                    {workout.description && (
                      <p className="text-muted-foreground mb-3">{workout.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {workout.exercises.length} exercícios
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startWorkout(workout)}
                      className="hover:bg-primary hover:text-primary-foreground"
                    >
                      <Play size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(workout)}
                    >
                      <Edit size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                          <Trash2 size={16} />
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
                          <AlertDialogAction
                            onClick={() => workout.id && handleDelete(workout.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Exercise List */}
                {workout.exercises.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                      Exercícios
                    </h4>
                    <div className="space-y-2">
                      {workout.exercises.slice(0, 3).map((exercise, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{exercise.exercise_name}</span>
                          <span className="text-muted-foreground">
                            {exercise.sets}x{exercise.reps} {exercise.weight > 0 && `• ${exercise.weight}kg`}
                          </span>
                        </div>
                      ))}
                      {workout.exercises.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{workout.exercises.length - 3} exercícios
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workouts;