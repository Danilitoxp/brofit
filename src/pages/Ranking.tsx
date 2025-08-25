import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Medal, Crown, Target, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRanking, RankingEntry } from "@/hooks/useRanking";
import { SEO } from "@/components/SEO";
const Ranking = () => {
  const {
    loading,
    exerciseNames,
    getExerciseRanking,
    getGeneralRanking,
    getFriendsRanking
  } = useRanking();
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [exerciseRanking, setExerciseRanking] = useState<RankingEntry[]>([]);
  const [generalRanking, setGeneralRanking] = useState<RankingEntry[]>([]);
  const [friendsRanking, setFriendsRanking] = useState<RankingEntry[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const fetchExerciseRanking = async (exercise: string) => {
    if (!exercise) return;
    setLoadingRanking(true);
    try {
      const data = await getExerciseRanking(exercise, 50);
      setExerciseRanking(data);
    } finally {
      setLoadingRanking(false);
    }
  };
  const fetchGeneralRanking = async () => {
    setLoadingRanking(true);
    try {
      const data = await getGeneralRanking(50);
      setGeneralRanking(data);
    } finally {
      setLoadingRanking(false);
    }
  };
  const fetchFriendsRanking = async (exercise?: string) => {
    setLoadingRanking(true);
    try {
      const data = await getFriendsRanking(exercise);
      setFriendsRanking(data);
    } finally {
      setLoadingRanking(false);
    }
  };
  useEffect(() => {
    if (exerciseNames.length > 0 && !selectedExercise) {
      // Usar Supino Reto como padrão ou primeiro exercício disponível
      const defaultExercise = exerciseNames.includes('Supino Reto') ? 'Supino Reto' : exerciseNames[0];
      setSelectedExercise(defaultExercise);
    }
  }, [exerciseNames]);
  useEffect(() => {
    if (selectedExercise) {
      fetchExerciseRanking(selectedExercise);
      fetchFriendsRanking(selectedExercise);
    }
  }, [selectedExercise]);
  useEffect(() => {
    fetchGeneralRanking();
  }, []);
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };
  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "outline";
      default:
        return "outline";
    }
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const RankingList = ({
    data,
    showTotalScore = false
  }: {
    data: RankingEntry[];
    showTotalScore?: boolean;
  }) => <div className="space-y-3">
      {data.length === 0 ? <Card className="floating-card p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
          <p className="text-muted-foreground">
            {selectedExercise ? "Ninguém registrou esse exercício ainda." : "Selecione um exercício para ver o ranking."}
          </p>
        </Card> : data.map(entry => <Card key={entry.user_id} className="floating-card p-4 hover:scale-[1.01] transition-all duration-300">
            <Link to={`/friends/${entry.user_id}`} className="flex items-center gap-4 hover:bg-muted/50 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                {getRankIcon(entry.rank)}
                <Badge variant={getRankBadgeVariant(entry.rank)} className="min-w-[40px] justify-center">
                  {entry.rank}º
                </Badge>
              </div>

              <Avatar className="w-12 h-12">
                <AvatarImage src={entry.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {getInitials(entry.display_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{entry.display_name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-bold">Peso: {entry.max_weight}kg</span>
                  {entry.max_reps && <span>• {entry.max_reps} reps</span>}
                </div>
              </div>
            </Link>
          </Card>)}
    </div>;
  if (loading) {
    return <div className="min-h-screen bg-background p-6">
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
  return <>
      <SEO title="Ranking Fitness - BroFit" description="Veja os rankings gerais, por exercício e entre amigos no BroFit. Compare seu progresso com a comunidade." canonicalPath="/ranking" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Trophy className="mr-3 text-primary" size={32} />
              Rankings
            </h1>
            
          </div>
        </div>

        {/* Filtros */}
        <Card className="floating-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-muted-foreground" />
            <div className="flex-1">
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Selecione um exercício" />
                </SelectTrigger>
                <SelectContent>
                  {exerciseNames.map(exercise => <SelectItem key={exercise} value={exercise}>
                      {exercise}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => {
              fetchGeneralRanking();
              if (selectedExercise) {
                fetchExerciseRanking(selectedExercise);
                fetchFriendsRanking(selectedExercise);
              }
            }}>
              Atualizar
            </Button>
          </div>
        </Card>

        {/* Tabs de Rankings */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Trophy size={16} />
              Geral
            </TabsTrigger>
            <TabsTrigger value="exercise" className="flex items-center gap-2">
              <Target size={16} />
              Por Exercício
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users size={16} />
              Amigos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                
                {loadingRanking && <div className="animate-pulse text-sm text-muted-foreground">
                    Carregando...
                  </div>}
              </div>
              
              <RankingList data={generalRanking} showTotalScore={false} />
            </div>
          </TabsContent>

          <TabsContent value="exercise" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {selectedExercise ? `Ranking - ${selectedExercise}` : "Selecione um exercício"}
                </h2>
                {loadingRanking && <div className="animate-pulse text-sm text-muted-foreground">
                    Carregando...
                  </div>}
              </div>

              <RankingList data={exerciseRanking} showTotalScore={false} />
            </div>
          </TabsContent>

          <TabsContent value="friends" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {selectedExercise ? `Amigos - ${selectedExercise}` : "Ranking dos Amigos"}
                </h2>
                {loadingRanking && <div className="animate-pulse text-sm text-muted-foreground">
                    Carregando...
                  </div>}
              </div>

              {friendsRanking.length === 0 ? <Card className="floating-card p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum amigo encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione amigos para ver como vocês se comparam!
                  </p>
                  <Button variant="outline">
                    <Target className="mr-2" size={16} />
                    Encontrar Amigos
                  </Button>
                </Card> : <RankingList data={friendsRanking} showTotalScore={false} />}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>;
};
export default Ranking;