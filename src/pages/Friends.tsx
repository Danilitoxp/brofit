import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Search, Check, X, Users, UserCheck, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriends, UserSearchResult } from "@/hooks/useFriends";
import { useNotifications } from "@/hooks/useNotifications";
import { Separator } from "@/components/ui/separator";
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

const Friends = () => {
  const {
    friends,
    pendingRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    cancelFriendRequest
  } = useFriends();

  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsSearching(true);
      try {
        const results = await searchUsers(query);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getExperienceLabel = (level?: string) => {
    switch (level) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return '';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const FriendCard = ({ friend }: { friend: any }) => (
    <Card className="floating-card p-4 hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center gap-4">
        <Link 
          to={`/friends/${friend.user_id}`} 
          className="flex items-center gap-4 flex-1 hover:bg-muted/50 p-2 rounded-lg transition-colors"
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={friend.avatar_url} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {getInitials(friend.display_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="font-semibold">{friend.display_name}</h3>
            <div className="flex items-center gap-2">
              {friend.experience_level && (
                <Badge variant="outline" className="text-xs">
                  {getExperienceLabel(friend.experience_level)}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Amigos desde {formatTimeAgo(friend.created_at)}
              </span>
            </div>
            {friend.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{friend.bio}</p>
            )}
          </div>
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive">
              Remover
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover amigo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover {friend.display_name} da sua lista de amigos?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => removeFriend(friend.friendship_id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );

  const RequestCard = ({ request }: { request: any }) => (
    <Card className="floating-card p-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={request.requester_avatar} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
            {getInitials(request.requester_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-semibold">{request.requester_name}</h3>
          <p className="text-sm text-muted-foreground">
            Enviou um convite de amizade • {formatTimeAgo(request.created_at)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => acceptFriendRequest(request.id)}
            className="bg-secondary hover:bg-secondary/90"
          >
            <Check size={16} className="mr-1" />
            Aceitar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => declineFriendRequest(request.id)}
          >
            <X size={16} className="mr-1" />
            Recusar
          </Button>
        </div>
      </div>
    </Card>
  );

  const SearchResultCard = ({ user }: { user: UserSearchResult }) => (
    <Card className="floating-card p-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
            {getInitials(user.display_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-semibold">{user.display_name}</h3>
          {user.nickname && (
            <p className="text-sm text-primary font-medium">@{user.nickname}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {user.experience_level && (
              <Badge variant="outline" className="text-xs">
                {getExperienceLabel(user.experience_level)}
              </Badge>
            )}
          </div>
          {user.bio && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
          )}
        </div>

        {user.friendship_status === 'none' && (
          <Button
            size="sm"
            onClick={() => sendFriendRequest(user.user_id)}
          >
            <UserPlus size={16} className="mr-1" />
            Adicionar
          </Button>
        )}

        {user.friendship_status === 'pending' && user.is_requester && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => cancelFriendRequest(user.user_id)}
          >
            Cancelar
          </Button>
        )}

        {user.friendship_status === 'pending' && !user.is_requester && (
          <Badge variant="secondary">Convite recebido</Badge>
        )}

        {user.friendship_status === 'accepted' && (
          <Badge variant="default">
            <UserCheck size={12} className="mr-1" />
            Amigos
          </Badge>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center">
              <Users className="mr-2 md:mr-3 text-primary" size={28} />
              Amigos
            </h1>
            <p className="text-muted-foreground">
              Conecte-se com outros atletas e acompanhe seu progresso
            </p>
          </div>
        </div>

        {/* Busca */}
        <Card className="floating-card p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Search size={20} className="text-muted-foreground" />
              <Input
                placeholder="Buscar usuários por nome ou nickname..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1"
              />
            </div>

            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-pulse text-sm text-muted-foreground">
                  Buscando usuários...
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Resultados da busca</h3>
                {searchResults.map((user) => (
                  <SearchResultCard key={user.user_id} user={user} />
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Users size={14} />
              <span className="hidden sm:inline">Amigos</span> ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <UserPlus size={14} />
              <span className="hidden sm:inline">Solicitações</span> ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Bell size={14} />
              <span className="hidden sm:inline">Notificações</span> ({unreadCount})
            </TabsTrigger>
          </TabsList>

          {/* Lista de Amigos */}
          <TabsContent value="friends" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Meus Amigos</h2>
              </div>

              {friends.length === 0 ? (
                <Card className="floating-card p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum amigo ainda</h3>
                  <p className="text-muted-foreground mb-4">
                    Conecte-se com outros atletas para comparar progresso e se motivar!
                  </p>
                  <Button variant="outline">
                    <Search className="mr-2" size={16} />
                    Buscar Amigos
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Solicitações Pendentes */}
          <TabsContent value="requests" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Solicitações de Amizade</h2>
              </div>

              {pendingRequests.length === 0 ? (
                <Card className="floating-card p-8 text-center">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação</h3>
                  <p className="text-muted-foreground">
                    Você não tem solicitações de amizade pendentes.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notificações */}
          <TabsContent value="notifications" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Notificações</h2>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    Marcar todas como lidas
                  </Button>
                )}
              </div>

              {notifications.length === 0 ? (
                <Card className="floating-card p-8 text-center">
                  <BellOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
                  <p className="text-muted-foreground">
                    Você está em dia com todas as suas notificações.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`floating-card p-4 cursor-pointer transition-all duration-300 ${
                        !notification.read ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${!notification.read ? 'text-primary' : ''}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">Nova</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Friends;