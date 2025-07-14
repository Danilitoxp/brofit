import { useState } from "react";
import { ArrowLeft, Plus, Dumbbell, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const QuickWorkout = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState({
    name: '',
    weight: '',
    reps: '',
    sets: ''
  });

  const addExercise = () => {
    if (!newExercise.name.trim()) return;
    
    setExercises(prev => [...prev, {
      id: Date.now(),
      ...newExercise,
      weight: parseInt(newExercise.weight) || 0,
      reps: parseInt(newExercise.reps) || 0,
      sets: parseInt(newExercise.sets) || 1
    }]);
    
    setNewExercise({ name: '', weight: '', reps: '', sets: '' });
  };

  const removeExercise = (id) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const updateExercise = (id, field, value) => {
    setExercises(prev => prev.map(ex => 
      ex.id === id ? { ...ex, [field]: field === 'name' ? value : parseInt(value) || 0 } : ex
    ));
  };

  const saveWorkout = () => {
    if (exercises.length === 0) return;
    
    // Here you would save to database
    console.log('Saving workout:', exercises);
    navigate('/workouts');
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">Treino Rápido</h1>
          <p className="text-sm text-muted-foreground">
            Registre seu treino atual
          </p>
        </div>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={saveWorkout}
          disabled={exercises.length === 0}
        >
          <Save size={16} />
        </Button>
      </div>

      {/* Add Exercise Form */}
      <Card className="floating-card mb-6 p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Dumbbell className="text-primary" size={20} />
          Adicionar Exercício
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="exercise-name">Nome do Exercício</Label>
            <Input
              id="exercise-name"
              value={newExercise.name}
              onChange={(e) => setNewExercise(prev => ({...prev, name: e.target.value}))}
              placeholder="Ex: Supino Reto"
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="exercise-weight">Peso (kg)</Label>
              <Input
                id="exercise-weight"
                type="number"
                value={newExercise.weight}
                onChange={(e) => setNewExercise(prev => ({...prev, weight: e.target.value}))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="exercise-reps">Reps</Label>
              <Input
                id="exercise-reps"
                type="number"
                value={newExercise.reps}
                onChange={(e) => setNewExercise(prev => ({...prev, reps: e.target.value}))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="exercise-sets">Séries</Label>
              <Input
                id="exercise-sets"
                type="number"
                value={newExercise.sets}
                onChange={(e) => setNewExercise(prev => ({...prev, sets: e.target.value}))}
                placeholder="1"
                className="mt-1"
              />
            </div>
          </div>
          
          <Button 
            onClick={addExercise}
            className="w-full"
            disabled={!newExercise.name.trim()}
          >
            <Plus size={16} className="mr-2" />
            Adicionar Exercício
          </Button>
        </div>
      </Card>

      {/* Exercise List */}
      {exercises.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Exercícios Adicionados ({exercises.length})
          </h3>
          
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="floating-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{exercise.name}</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExercise(exercise.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Peso (kg)</Label>
                  <Input
                    type="number"
                    value={exercise.weight}
                    onChange={(e) => updateExercise(exercise.id, 'weight', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Reps</Label>
                  <Input
                    type="number"
                    value={exercise.reps}
                    onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Séries</Label>
                  <Input
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => updateExercise(exercise.id, 'sets', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {exercises.length === 0 && (
        <Card className="floating-card p-8 text-center">
          <Dumbbell className="mx-auto text-muted-foreground mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2">Nenhum exercício adicionado</h3>
          <p className="text-muted-foreground">
            Adicione exercícios usando o formulário acima
          </p>
        </Card>
      )}

      {/* Save Button */}
      {exercises.length > 0 && (
        <div className="mt-8">
          <Button 
            variant="secondary" 
            size="lg"
            className="w-full h-14"
            onClick={saveWorkout}
          >
            <Save className="mr-2" size={20} />
            Salvar Treino ({exercises.length} exercícios)
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuickWorkout;