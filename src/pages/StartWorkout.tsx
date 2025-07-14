import { useState } from "react";
import { ArrowLeft, Play, Plus, Timer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const StartWorkout = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [exercises] = useState([
    { id: 1, name: "Supino Reto", sets: 3, reps: 12, weight: 80, completed: false },
    { id: 2, name: "Supino Inclinado", sets: 3, reps: 10, weight: 70, completed: false },
    { id: 3, name: "Crucifixo", sets: 3, reps: 12, weight: 15, completed: false },
    { id: 4, name: "Tríceps Testa", sets: 3, reps: 12, weight: 40, completed: false },
    { id: 5, name: "Tríceps Corda", sets: 3, reps: 15, weight: 35, completed: false },
  ]);

  const [exerciseData, setExerciseData] = useState(
    exercises.reduce((acc, ex) => ({
      ...acc,
      [ex.id]: { weight: ex.weight, reps: ex.reps, completed: ex.completed }
    }), {})
  );

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExercise = (id) => {
    setExerciseData(prev => ({
      ...prev,
      [id]: { ...prev[id], completed: !prev[id].completed }
    }));
  };

  const updateWeight = (id, weight) => {
    setExerciseData(prev => ({
      ...prev,
      [id]: { ...prev[id], weight: parseInt(weight) || 0 }
    }));
  };

  const updateReps = (id, reps) => {
    setExerciseData(prev => ({
      ...prev,
      [id]: { ...prev[id], reps: parseInt(reps) || 0 }
    }));
  };

  const completedCount = Object.values(exerciseData).filter((ex: any) => ex.completed).length;

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">Peito & Tríceps</h1>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{exercises.length} concluídos
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Timer Card */}
      <Card className="floating-card mb-6 bg-gradient-primary p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-foreground">
              Tempo de Treino
            </h2>
            <p className="text-3xl font-mono font-bold text-primary-foreground">
              {formatTime(time)}
            </p>
          </div>
          <Button 
            variant="glass"
            size="lg"
            onClick={() => setIsActive(!isActive)}
            className="text-primary-foreground border-primary-foreground/20"
          >
            {isActive ? <Timer size={20} /> : <Play size={20} />}
            {isActive ? "Pausar" : "Iniciar"}
          </Button>
        </div>
        
        <div className="w-full bg-primary-foreground/20 rounded-full h-2">
          <div 
            className="bg-secondary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / exercises.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Exercise List */}
      <div className="space-y-4">
        {exercises.map((exercise) => (
          <Card 
            key={exercise.id}
            className={`floating-card p-4 transition-all duration-300 ${
              exerciseData[exercise.id]?.completed 
                ? 'bg-secondary/10 border-secondary/30' 
                : 'hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleExercise(exercise.id)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    exerciseData[exercise.id]?.completed
                      ? 'bg-secondary border-secondary text-secondary-foreground'
                      : 'border-muted-foreground'
                  }`}
                >
                  {exerciseData[exercise.id]?.completed && <Check size={12} />}
                </Button>
                <div>
                  <h3 className={`font-semibold ${
                    exerciseData[exercise.id]?.completed ? 'line-through text-muted-foreground' : ''
                  }`}>
                    {exercise.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {exercise.sets} séries
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Peso (kg)</label>
                <Input
                  type="number"
                  value={exerciseData[exercise.id]?.weight || ''}
                  onChange={(e) => updateWeight(exercise.id, e.target.value)}
                  className="mt-1"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Repetições</label>
                <Input
                  type="number"
                  value={exerciseData[exercise.id]?.reps || ''}
                  onChange={(e) => updateReps(exercise.id, e.target.value)}
                  className="mt-1"
                  placeholder="0"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Finish Workout Button */}
      <div className="mt-8">
        <Button 
          variant="secondary" 
          size="lg"
          className="w-full h-14"
          disabled={completedCount === 0}
        >
          <Check className="mr-2" size={20} />
          Finalizar Treino ({completedCount}/{exercises.length})
        </Button>
      </div>
    </div>
  );
};

export default StartWorkout;