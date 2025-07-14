import { Home, Dumbbell, Trophy, User, Users, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/workouts", icon: Dumbbell, label: "Treinos" },
    { href: "/ranking", icon: Trophy, label: "Ranking" },
    { href: "/friends", icon: Users, label: "Amigos" },
    { href: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-1 py-2 max-w-screen-sm mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-[60px]",
                "text-muted-foreground hover:text-primary active:scale-95",
                isActive && "text-primary bg-primary/10 glow-primary"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={22} 
                  className={cn(
                    "transition-all duration-300",
                    isActive && "scale-110"
                  )} 
                />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        
        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 text-muted-foreground hover:text-destructive active:scale-95 min-w-[60px] h-auto"
        >
          <LogOut size={22} />
          <span className="text-[10px] font-medium leading-tight">Sair</span>
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;