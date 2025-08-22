import { useState } from "react";
import { Mail, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu email.",
        variant: "destructive"
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível enviar o email. Tente novamente.",
          variant: "destructive"
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha."
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
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
          </div>

          {/* Success Card */}
          <Card className="floating-card p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Email enviado!</h2>
            <p className="text-muted-foreground mb-6">
              Enviamos um link para redefinir sua senha para <strong>{email}</strong>. 
              Verifique sua caixa de entrada e clique no link para continuar.
            </p>

            <div className="space-y-4">
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Não recebeu o email? Verifique sua pasta de spam ou{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-primary font-semibold"
                  onClick={() => setEmailSent(false)}
                >
                  tente novamente
                </Button>
              </p>
            </div>
          </Card>
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
            Recuperar senha
          </p>
        </div>

        {/* Back Button */}
        <Button
          onClick={() => navigate('/auth')}
          variant="ghost"
          className="mb-6 p-0 h-auto text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao login
        </Button>

        {/* Form Card */}
        <Card className="floating-card p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Esqueceu sua senha?</h2>
            <p className="text-muted-foreground text-sm">
              Digite seu email abaixo e enviaremos um link para redefinir sua senha.
            </p>
          </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  Enviar link de recuperação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;