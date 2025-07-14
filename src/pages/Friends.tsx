import { useState } from "react";
import { UserPlus, Search, Check, X, Users, MessageCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Friends = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends"); // friends | requests | search

  const friends = [
    {
      id: 1,
      name: "João Silva",
      avatar: "🔥",
      status: "online",
      lastWorkout: "2 horas atrás",
      streak: 15,
      currentPR: "Supino: 120kg"
    },
    {
      id: 2,
      name: "Carlos Mendez",
      avatar: "⚡",
      status: "offline",
      lastWorkout: "1 dia atrás",
      streak: 8,
      currentPR: "Agachamento: 140kg"
    },
    {
      id: 3,
      name: "Rafael Costa",
      avatar: "🎯",
      status: "training",
      lastWorkout: "Agora",
      streak: 20,
      currentPR: "Terra: 160kg"
    },
  ];

  const pendingRequests = [
    {
      id: 4,
      name: "Bruno Alves",
      avatar: "🚀",
      mutualFriends: 2,
      streak: 5
    },
    {
      id: 5,
      name: "Lucas Santos",
      avatar: "💎",
      mutualFriends: 1,
      streak: 12
    },
  ];

  const searchResults = [
    {
      id: 6,
      name: "Pedro Lima",
      avatar: "⭐",
      mutualFriends: 3,
      streak: 18
    },
    {
      id: 7,
      name: "Felipe Rocha",
      avatar: "🎪",
      mutualFriends: 0,
      streak: 7
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-secondary";
      case "training": return "bg-accent animate-pulse";
      case "offline": return "bg-muted";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Online";
      case "training": return "Treinando";
      case "offline": return "Offline";
      default: return "Offline";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold bg-gradient-secondary bg-clip-text text-transparent">
            Amigos
          </h1>
          <p className="text-muted-foreground">
            Conecte-se e compete com seus bros
          </p>
        </div>
        <Button variant="secondary" size="icon">
          <UserPlus size={20} />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "friends" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("friends")}
        >
          <Users className="mr-2" size={16} />
          Amigos ({friends.length})
        </Button>
        <Button
          variant={activeTab === "requests" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("requests")}
        >
          Solicitações ({pendingRequests.length})
        </Button>
        <Button
          variant={activeTab === "search" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("search")}
        >
          <Search className="mr-2" size={16} />
          Buscar
        </Button>
      </div>

      {/* Search Bar */}
      {activeTab === "search" && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Buscar por nome ou ID do usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Friends List */}
      {activeTab === "friends" && (
        <div className="space-y-4">
          {friends.map((friend) => (
            <div key={friend.id} className="floating-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-surface flex items-center justify-center text-xl">
                      {friend.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(friend.status)}`} />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">{friend.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getStatusText(friend.status)} • {friend.lastWorkout}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <MessageCircle size={16} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trophy size={16} />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Sequência</p>
                  <p className="font-semibold text-accent">{friend.streak} dias</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Último PR</p>
                  <p className="font-semibold text-primary">{friend.currentPR}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="floating-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-surface flex items-center justify-center text-xl">
                      {request.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold">{request.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {request.mutualFriends} amigos em comum
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="secondary" size="icon">
                      <Check size={16} />
                    </Button>
                    <Button variant="outline" size="icon">
                      <X size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm">
                  <p className="text-muted-foreground">Sequência: 
                    <span className="font-semibold text-accent ml-1">{request.streak} dias</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search Results */}
      {activeTab === "search" && (
        <div className="space-y-4">
          {searchQuery.length > 0 ? (
            searchResults.map((user) => (
              <div key={user.id} className="floating-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-surface flex items-center justify-center text-xl">
                      {user.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.mutualFriends} amigos em comum • {user.streak} dias de sequência
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="secondary" size="sm">
                    <UserPlus className="mr-2" size={14} />
                    Adicionar
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Search className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">Digite para buscar novos amigos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Friends;