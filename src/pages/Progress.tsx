import { useState } from "react";
import { ArrowLeft, TrendingUp, Calendar, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const Progress = () => {
  const navigate = useNavigate();
  
  const [progressData] = useState({
    currentWeek: {
      workoutsCompleted: 4,
      totalWorkouts: 6,
      totalWeight: 2450,
      personalRecords: 2
    },
    weeklyProgress: [
      { week: 'Sem 1', workouts: 5, weight: 2200 },
      { week: 'Sem 2', workouts: 4, weight: 2300 },
      { week: 'Sem 3', workouts: 6, weight: 2350 },
      { week: 'Sem 4', workouts: 4, weight: 2450 },
    ],
    exerciseProgress: [
      { 
        name: 'Supino Reto',
        current: 85,
        previous: 80,
        sessions: [
          { date: '10/01', weight: 75 },
          { date: '15/01', weight: 80 },
          { date: '20/01', weight: 82 },
          { date: '25/01', weight: 85 },
        ]
      },
      { 
        name: 'Agachamento',
        current: 120,
        previous: 115,
        sessions: [
          { date: '12/01', weight: 110 },
          { date: '17/01', weight: 115 },
          { date: '22/01', weight: 118 },
          { date: '27/01', weight: 120 },
        ]
      },
      { 
        name: 'Deadlift',
        current: 140,
        previous: 135,
        sessions: [
          { date: '11/01', weight: 130 },
          { date: '16/01', weight: 135 },
          { date: '21/01', weight: 138 },
          { date: '26/01', weight: 140 },
        ]
      }
    ]
  });

  const getProgressPercentage = (current, previous) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">Evolução</h1>
          <p className="text-sm text-muted-foreground">
            Seu progresso e estatísticas
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="stat-card">
          <div className="flex items-center justify-center mb-2">
            <Target className="text-secondary" size={24} />
          </div>
          <p className="text-2xl font-bold text-secondary">
            {progressData.currentWeek.workoutsCompleted}/{progressData.currentWeek.totalWorkouts}
          </p>
          <p className="text-muted-foreground text-sm">Esta Semana</p>
        </Card>

        <Card className="stat-card">
          <div className="flex items-center justify-center mb-2">
            <Award className="text-accent" size={24} />
          </div>
          <p className="text-2xl font-bold text-accent">
            {progressData.currentWeek.personalRecords}
          </p>
          <p className="text-muted-foreground text-sm">Novos PRs</p>
        </Card>
      </div>

      {/* Progress Tabs */}
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="exercises">Exercícios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="space-y-4 mt-6">
          <Card className="floating-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-primary" size={20} />
              <h2 className="text-lg font-semibold">Progresso Semanal</h2>
            </div>
            
            <div className="space-y-4">
              {progressData.weeklyProgress.map((week, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-semibold">{week.week}</p>
                    <p className="text-sm text-muted-foreground">
                      {week.workouts} treinos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{week.weight}kg</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="floating-card p-6 bg-gradient-accent">
            <h3 className="text-lg font-bold text-accent-foreground mb-2">
              Volume Total da Semana
            </h3>
            <p className="text-3xl font-bold text-accent-foreground">
              {progressData.currentWeek.totalWeight}kg
            </p>
            <p className="text-accent-foreground/80 text-sm">
              +200kg vs semana anterior
            </p>
          </Card>
        </TabsContent>
        
        <TabsContent value="exercises" className="space-y-4 mt-6">
          {progressData.exerciseProgress.map((exercise, index) => (
            <Card key={index} className="floating-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{exercise.name}</h3>
                <div className="flex items-center gap-1 text-secondary">
                  <TrendingUp size={16} />
                  <span className="text-sm font-medium">
                    +{getProgressPercentage(exercise.current, exercise.previous)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {exercise.current}kg
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Atual (era {exercise.previous}kg)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Últimas Sessões
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {exercise.sessions.map((session, sessionIndex) => (
                    <div 
                      key={sessionIndex}
                      className="text-center p-2 bg-muted/30 rounded-lg"
                    >
                      <p className="text-xs text-muted-foreground">
                        {session.date}
                      </p>
                      <p className="font-semibold text-sm">
                        {session.weight}kg
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Progress;