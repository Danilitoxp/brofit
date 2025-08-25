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
      
    </header>;
};
export default Header;