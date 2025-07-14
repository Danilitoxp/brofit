import { useState } from "react";
import { Trophy, Medal, TrendingUp, Users, Target, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const Ranking = () => {
  const [selectedExercise, setSelectedExercise] = useState("Supino Reto");
  const [rankingType, setRankingType] = useState("friends"); // friends | global

  const exercises = [
    "Supino Reto",
    "Agachamento",
    "Levantamento Terra",
    "Desenvolvimento",
    "Rosca Direta"
  ];

  const friendsRanking = [
    { 
      id: 1, 
      name: "João Silva", 
      weight: 120, 
      avatar: "🔥",
      streak: 15,
      isMe: false
    },
    { 
      id: 2, 
      name: "Você", 
      weight: 110, 
      avatar: "💪",
      streak: 12,
      isMe: true
    },
    { 
      id: 3, 
      name: "Carlos Mendez", 
      weight: 105, 
      avatar: "⚡",
      streak: 8,
      isMe: false
    },
    { 
      id: 4, 
      name: "Rafael Costa", 
      weight: 100, 
      avatar: "🎯",
      streak: 20,
      isMe: false
    },
    { 
      id: 5, 
      name: "Bruno Alves", 
      weight: 95, 
      avatar: "🚀",
      streak: 5,
      isMe: false
    },
  ];

  const globalRanking = [
    { 
      id: 1, 
      name: "Beast Mode Pro", 
      weight: 180, 
      avatar: "👑",
      streak: 45,
      isMe: false
    },
    { 
      id: 2, 
      name: "Iron Warrior", 
      weight: 165, 
      avatar: "⚔️",
      streak: 32,
      isMe: false
    },
    { 
      id: 3, 
      name: "Strength King", 
      weight: 155, 
      avatar: "🦍",
      streak: 28,
      isMe: false
    },
  ];

  const currentRanking = rankingType === "friends" ? friendsRanking : globalRanking;

  const getRankBadge = (position: number, isMe: boolean) => {
    if (position === 1) return "rank-1";
    if (position === 2) return "rank-2";
    if (position === 3) return "rank-3";
    if (isMe) return "bg-primary/20 border-primary";
    return "bg-card";
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="text-accent-foreground" size={20} />;
    if (position === 2) return <Medal className="text-primary-foreground" size={20} />;
    if (position === 3) return <Trophy className="text-secondary-foreground" size={20} />;
    return <span className="text-muted-foreground font-bold">#{position}</span>;
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold bg-gradient-ranking bg-clip-text text-transparent mb-2">
          Rankings
        </h1>
        <p className="text-muted-foreground">
          Compete com seus amigos e suba no ranking!
        </p>
      </div>

      {/* Exercise Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Exercício</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {exercises.map((exercise) => (
            <Button
              key={exercise}
              variant={selectedExercise === exercise ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setSelectedExercise(exercise)}
            >
              {exercise}
            </Button>
          ))}
        </div>
      </div>

      {/* Ranking Type Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={rankingType === "friends" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setRankingType("friends")}
        >
          <Users className="mr-2" size={16} />
          Amigos
        </Button>
        <Button
          variant={rankingType === "global" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setRankingType("global")}
        >
          <Trophy className="mr-2" size={16} />
          Global
        </Button>
      </div>

      {/* My Position Card */}
      {rankingType === "friends" && (
        <div className="floating-card mb-6 bg-gradient-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">Sua Posição</p>
              <p className="text-2xl font-bold text-primary-foreground">#2</p>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/80 text-sm">Recorde Pessoal</p>
              <p className="text-2xl font-bold text-primary-foreground">110kg</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-primary-foreground/20">
            <div className="flex items-center justify-between text-primary-foreground/80 text-sm">
              <span>Próximo objetivo: ultrapassar João Silva</span>
              <span className="font-semibold">+10kg</span>
            </div>
          </div>
        </div>
      )}

      {/* Ranking List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {rankingType === "friends" ? "Ranking dos Amigos" : "Ranking Global"}
          </h3>
          <TrendingUp className="text-primary" size={20} />
        </div>

        {currentRanking.map((user, index) => (
          <div
            key={user.id}
            className={`floating-card p-4 ${getRankBadge(index + 1, user.isMe)} ${
              user.isMe ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  {getRankIcon(index + 1)}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{user.avatar}</span>
                  <div>
                    <p className={`font-semibold ${user.isMe ? 'text-primary' : ''}`}>
                      {user.name}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Target size={12} />
                      <span>{user.streak} dias de sequência</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold">{user.weight}kg</p>
                <p className="text-sm text-muted-foreground">Recorde</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Hint */}
      <div className="mt-8 p-4 bg-accent/10 border border-accent/30 rounded-2xl">
        <div className="flex items-center gap-3">
          <Crown className="text-accent" size={24} />
          <div>
            <p className="font-semibold text-accent">Dica de Conquista</p>
            <p className="text-sm text-muted-foreground">
              Bata seu recorde pessoal para ganhar +50 XP!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranking;