import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.email.includes('@')) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let result;
      
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password);
      }

      if (result.error) {
        let errorMessage = "Ocorreu um erro inesperado.";
        
        if (result.error.message.includes('Invalid login credentials')) {
          errorMessage = "Email ou senha incorretos.";
        } else if (result.error.message.includes('User already registered')) {
          errorMessage = "Este email já está cadastrado. Tente fazer login.";
        } else if (result.error.message.includes('Password should be at least')) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
        } else if (result.error.message.includes('Invalid email')) {
          errorMessage = "Por favor, insira um email válido.";
        }

        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        if (isLogin) {
          toast({
            title: "Sucesso!",
            description: "Login realizado com sucesso!"
          });
          navigate('/');
        } else {
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar a conta."
          });
          setIsLogin(true);
          setFormData({ email: "", password: "", confirmPassword: "" });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: "", password: "", confirmPassword: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img 
              src="/lovable-uploads/199efe6d-81da-4ff6-82c3-ce01a564bff3.png" 
              alt="BroFit Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            BroFit
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Auth Form */}
        <Card className="floating-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password (only for signup) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Carregando..."
              ) : (
                <>
                  {isLogin ? "Entrar" : "Criar Conta"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-primary font-semibold"
                onClick={toggleMode}
              >
                {isLogin ? "Criar conta" : "Fazer login"}
              </Button>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Ao continuar, você concorda com nossos{" "}
            <a href="#" className="text-primary hover:underline">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href="#" className="text-primary hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;