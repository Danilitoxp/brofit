import { useState } from "react";
import { Edit, Settings, Trophy, Target, Calendar, Scale, Ruler, User, Lock, Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { ProfileForm } from "@/components/ProfileForm";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
const Profile = () => {
  const {
    user
  } = useAuth();
  const {
    profile,
    stats,
    loading,
    updateProfile,
    uploadAvatar,
    calculateAge,
    calculateBMI
  } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubmit = async (updates: any) => {
    setIsSubmitting(true);
    try {
      await updateProfile(updates);
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  const getExperienceLabel = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'Iniciante';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return 'Não informado';
    }
  };
  const getInitials = (name?: string) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
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
  if (isEditing) {
    return <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Editar Perfil</h1>
            <p className="text-muted-foreground">
              Atualize suas informações pessoais e configurações
            </p>
          </div>

          <ProfileForm profile={profile} onSubmit={handleSubmit} onCancel={() => setIsEditing(false)} onAvatarUpload={uploadAvatar} isLoading={isSubmitting} />
        </div>
      </div>;
  }
  const age = profile?.birth_date ? calculateAge(profile.birth_date) : null;
  const bmi = calculateBMI(profile?.weight, profile?.height);
  return <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais e configurações
            </p>
          </div>
          <Button onClick={() => setIsEditing(true)} className="hover-scale text-base text-center">
            <Edit size={20} className="mr-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Perfil Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <Card className="floating-card p-6">
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                    {getInitials(profile?.display_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  {/* Nome Principal */}
                  <div className="mb-4">
                    <h2 className="text-3xl font-bold mb-2">
                      {profile?.display_name || "Usuário"}
                    </h2>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={profile?.is_public ? "default" : "secondary"}>
                        {profile?.is_public ? <><Eye size={12} className="mr-1" /> Público</> : <><EyeOff size={12} className="mr-1" /> Privado</>}
                      </Badge>
                      {profile?.experience_level && <Badge variant="outline">
                          {getExperienceLabel(profile.experience_level)}
                        </Badge>}
                    </div>
                  </div>

                  {/* ID para Amigos */}
                  <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-primary mb-1">
                          🆔 ID para Amigos
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          Compartilhe este ID para que amigos possam te encontrar
                        </p>
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {user?.id?.slice(0, 8)}...{user?.id?.slice(-4)}
                        </code>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(user?.id || '');
                      toast({
                        title: "ID copiado!",
                        description: "O ID foi copiado para a área de transferência."
                      });
                    }}>
                        Copiar
                      </Button>
                    </div>
                  </div>

                  {profile?.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
                </div>
              </div>
            </Card>

            {/* Informações Pessoais e de Contato */}
            <Card className="floating-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User size={20} className="mr-2" />
                Informações Pessoais
              </h3>

              {/* Informações de Contato */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-muted-foreground text-sm uppercase tracking-wide">
                  Contato
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xs">@</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-xs text-muted-foreground break-all">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Físicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {age && <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{age}</div>
                    <div className="text-xs text-muted-foreground">anos</div>
                  </div>}

                {profile?.height && <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Ruler className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{profile.height}</div>
                    <div className="text-xs text-muted-foreground">cm</div>
                  </div>}

                {profile?.weight && <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Scale className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{profile.weight}</div>
                    <div className="text-xs text-muted-foreground">kg</div>
                  </div>}

                {bmi && <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{bmi.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">IMC</div>
                  </div>}
              </div>

              {profile?.fitness_goal && <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Target size={16} className="mr-2" />
                    Objetivo Principal
                  </h4>
                  <p className="text-sm">{profile.fitness_goal}</p>
                </div>}
            </Card>
          </div>

          {/* Sidebar com Estatísticas */}
          <div className="space-y-6">
            {/* Estatísticas de Treino */}
            <Card className="floating-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy size={20} className="mr-2" />
                Estatísticas
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de Treinos</span>
                  <span className="font-bold">{stats?.total_workouts || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Exercícios Realizados</span>
                  <span className="font-bold">{stats?.total_exercises || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Peso Total Levantado</span>
                  <span className="font-bold">{stats?.total_weight_lifted || 0}kg</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sequência Atual</span>
                  <Badge variant="secondary">{stats?.current_streak || 0} dias</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Maior Sequência</span>
                  <Badge variant="outline">{stats?.longest_streak || 0} dias</Badge>
                </div>

                {stats?.last_workout_date && <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">Último Treino</span>
                      <div className="text-sm font-medium">
                        {format(new Date(stats.last_workout_date), "dd 'de' MMMM", {
                      locale: pt
                    })}
                      </div>
                    </div>
                  </>}
              </div>
            </Card>

            {/* Configurações Rápidas */}
            <Card className="floating-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Settings size={20} className="mr-2" />
                Configurações
              </h3>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Lock size={16} className="mr-2" />
                  Privacidade
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <User size={16} className="mr-2" />
                  Conta
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};
export default Profile;