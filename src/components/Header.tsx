import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
const Header = () => {
  const {
    user
  } = useAuth();
  const {
    profile
  } = useProfile();
  if (!user) return null;
  const displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return <header className="sticky top-0 z-40 w-full bg-card/95 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl overflow-hidden">
            <img src="/lovable-uploads/199efe6d-81da-4ff6-82c3-ce01a564bff3.png" alt="BroFit Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            BroFit
          </h1>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium leading-none text-right">{displayName}</p>
            <p className="text-muted-foreground text-xs font-thin">{user.email}</p>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>;
};
export default Header;