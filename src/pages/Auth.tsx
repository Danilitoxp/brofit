import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import brofitLogo from "@/assets/brofit-logo.png";
import gymHero from "@/assets/gym-hero.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isLogin) {
        // Mock login - in real app would integrate with Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta, bro! 💪"
        });
      } else {
        // Mock signup - in real app would integrate with Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: "Conta criada!",
          description: "Sua jornada no BroFit começou! 🚀"
        });
      }

      // Simulate saving user to localStorage
      const userData = {
        id: "1",
        name: formData.name || "Bro Fitness",
        email: formData.email,
        avatar: "💪",
        level: isLogin ? 15 : 1,
        xp: isLogin ? 2450 : 0,
        streak: isLogin ? 12 : 0
      };
      localStorage.setItem("brofit_user", JSON.stringify(userData));
      
      // Redirect to dashboard
      navigate("/");
      window.location.reload(); // Force reload to update auth state
    } catch (error) {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-4xl mx-auto mb-4 glow-primary animate-float">
            💪
          </div>
          <h1 className="text-4xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            BroFit
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Bem-vindo de volta, bro!" : "Junte-se à família BroFit"}
          </p>
        </div>

        {/* Auth Form */}
        <div className="floating-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (only for signup) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 h-12 rounded-xl"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-12 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (only for signup) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="********"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 h-12 rounded-xl"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 mt-6" 
              size="lg"
            >
              {isLogin ? "Entrar na Academia" : "Começar Jornada"}
            </Button>
          </form>

          {/* Forgot Password (only for login) */}
          {isLogin && (
            <div className="text-center mt-4">
              <button className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </button>
            </div>
          )}

          {/* Toggle Auth Mode */}
          <div className="text-center mt-6 pt-6 border-t border-border">
            <p className="text-muted-foreground">
              {isLogin ? "Novo no BroFit?" : "Já tem uma conta?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-primary font-semibold hover:underline"
              >
                {isLogin ? "Criar conta" : "Fazer login"}
              </button>
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3">
            <div className="text-2xl mb-2">🏆</div>
            <p className="text-xs text-muted-foreground">Rankings</p>
          </div>
          <div className="p-3">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-xs text-muted-foreground">Evolução</p>
          </div>
          <div className="p-3">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-xs text-muted-foreground">Amigos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;