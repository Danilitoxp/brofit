import { useState } from "react";
import { Settings, Edit2, Trophy, TrendingUp, Calendar, Target, Flame, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const [user] = useState({
    name: "Você",
    avatar: "💪",
    level: 15,
    xp: 2450,
    nextLevelXP: 3000,
    joinDate: "Janeiro 2024",
    streak: 12,
    totalWorkouts: 89,
    personalRecords: 15,
    favoriteExercise: "Supino Reto"
  });

  const achievements = [
    {
      id: 1,
      title: "Primeira Semana",
      description: "Complete 7 dias consecutivos",
      icon: "🎯",
      earned: true,
      earnedDate: "05/01/2024"
    },
    {
      id: 2,
      title: "Força Bruta",
      description: "Alcance 100kg no supino",
      icon: "💪",
      earned: true,
      earnedDate: "15/02/2024"
    },
    {
      id: 3,
      title: "Consistência",
      description: "30 dias de sequência",
      icon: "🔥",
      earned: false,
      progress: 40
    },
    {
      id: 4,
      title: "Beast Mode",
      description: "50 treinos completados",
      icon: "🦍",
      earned: true,
      earnedDate: "01/03/2024"
    },
  ];

  const stats = [
    { label: "Treinos Totais", value: user.totalWorkouts, icon: Calendar, color: "text-primary" },
    { label: "Sequência Atual", value: `${user.streak} dias`, icon: Flame, color: "text-accent" },
    { label: "Recordes Pessoais", value: user.personalRecords, icon: Trophy, color: "text-secondary" },
    { label: "Nível Atual", value: user.level, icon: Target, color: "text-ranking" },
  ];

  const getXPProgress = () => {
    const currentLevelXP = user.nextLevelXP - 550; // Assuming 550 XP per level gap
    const progressXP = user.xp - currentLevelXP;
    const levelGap = user.nextLevelXP - currentLevelXP;
    return (progressXP / levelGap) * 100;
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold bg-gradient-accent bg-clip-text text-transparent">
          Perfil
        </h1>
        <Button variant="ghost" size="icon">
          <Settings size={20} />
        </Button>
      </div>

      {/* Profile Card */}
      <div className="floating-card mb-6 bg-gradient-surface text-center p-6">
        <div className="relative inline-block mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-4xl mx-auto glow-primary">
            {user.avatar}
          </div>
          <Button variant="secondary" size="icon" className="absolute -bottom-2 -right-2 w-8 h-8">
            <Edit2 size={12} />
          </Button>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
        <p className="text-muted-foreground mb-4">Membro desde {user.joinDate}</p>
        
        {/* Level Progress */}
        <div className="bg-muted rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${getXPProgress()}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Level {user.level} • {user.xp}/{user.nextLevelXP} XP
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-center mb-3">
              <stat.icon className={stat.color} size={24} />
            </div>
            <p className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </p>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Conquistas</h3>
          <Award className="text-ranking" size={20} />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`floating-card p-4 text-center transition-all duration-300 ${
                achievement.earned 
                  ? 'bg-gradient-ranking glow-ranking' 
                  : 'opacity-60 hover:opacity-80'
              }`}
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <h4 className={`font-semibold text-sm mb-1 ${
                achievement.earned ? 'text-ranking-foreground' : ''
              }`}>
                {achievement.title}
              </h4>
              <p className={`text-xs ${
                achievement.earned ? 'text-ranking-foreground/80' : 'text-muted-foreground'
              }`}>
                {achievement.description}
              </p>
              
              {achievement.earned ? (
                <p className="text-xs text-ranking-foreground/60 mt-2">
                  {achievement.earnedDate}
                </p>
              ) : achievement.progress && (
                <div className="mt-2">
                  <div className="bg-muted rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full"
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.progress}%
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="floating-card p-4 mb-6">
        <h3 className="font-semibold mb-3">Estatísticas Rápidas</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exercício Favorito</span>
            <span className="font-semibold">{user.favoriteExercise}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Maior Sequência</span>
            <span className="font-semibold text-accent">25 dias</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tempo Total Treinando</span>
            <span className="font-semibold text-primary">127h</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full h-12">
          <TrendingUp className="mr-2" size={20} />
          Ver Evolução Completa
        </Button>
        
        <Button variant="outline" className="w-full h-12">
          <Trophy className="mr-2" size={20} />
          Histórico de Conquistas
        </Button>
      </div>
    </div>
  );
};

export default Profile;