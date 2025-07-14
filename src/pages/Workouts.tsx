import { useState } from "react";
import { Plus, Calendar, Clock, Dumbbell, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Workouts = () => {
  const navigate = useNavigate();
  const [weeklyPlan] = useState([
    { 
      day: "Segunda", 
      name: "Peito & Tríceps", 
      exercises: 6,
      duration: 75,
      completed: true
    },
    { 
      day: "Terça", 
      name: "Costas & Bíceps", 
      exercises: 7,
      duration: 80,
      completed: true
    },
    { 
      day: "Quarta", 
      name: "Pernas", 
      exercises: 8,
      duration: 90,
      completed: false
    },
    { 
      day: "Quinta", 
      name: "Ombros & Trapézio", 
      exercises: 6,
      duration: 70,
      completed: false
    },
    { 
      day: "Sexta", 
      name: "Peito & Tríceps", 
      exercises: 6,
      duration: 75,
      completed: false
    },
    { 
      day: "Sábado", 
      name: "Costas & Bíceps", 
      exercises: 7,
      duration: 80,
      completed: false
    },
  ]);

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
            Meus Treinos
          </h1>
          <p className="text-muted-foreground">
            Sua rotina semanal personalizada
          </p>
        </div>
        <Button variant="accent" size="icon">
          <Plus size={20} />
        </Button>
      </div>

      {/* Weekly Overview Card */}
      <div className="floating-card mb-6 bg-gradient-surface">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Esta Semana</h2>
          <Calendar className="text-primary" size={24} />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">4</p>
            <p className="text-muted-foreground text-sm">Concluídos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">2</p>
            <p className="text-muted-foreground text-sm">Restantes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">67%</p>
            <p className="text-muted-foreground text-sm">Progress</p>
          </div>
        </div>
      </div>

      {/* Workout Plan */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Plano Semanal</h3>
        
        {weeklyPlan.map((workout, index) => (
          <div 
            key={index}
            className={`floating-card p-4 transition-all duration-300 ${
              workout.completed 
                ? 'bg-secondary/10 border-secondary/30' 
                : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  workout.completed ? 'bg-secondary glow-secondary' : 'bg-muted'
                }`} />
                <div>
                  <h4 className="font-semibold">{workout.day}</h4>
                  <p className="text-sm text-muted-foreground">{workout.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Edit2 size={16} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Dumbbell size={14} />
                  <span>{workout.exercises} exercícios</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{workout.duration}min</span>
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant={workout.completed ? "secondary" : "default"}
                disabled={workout.completed}
                onClick={() => !workout.completed && navigate('/start-workout')}
              >
                {workout.completed ? "✅ Concluído" : "Iniciar"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Workout */}
      <div className="mt-8">
        <Button 
          variant="outline" 
          className="w-full h-14 border-dashed border-primary/30 hover:border-primary/60"
        >
          <Plus className="mr-2" size={20} />
          Criar Novo Treino
        </Button>
      </div>
    </div>
  );
};

export default Workouts;