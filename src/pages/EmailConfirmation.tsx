import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';

const EmailConfirmation = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash from URL which contains the tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error setting session:', error);
            setStatus('error');
            return;
          }

          setStatus('success');
          
          // Start countdown for automatic redirect
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate('/', { replace: true });
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(timer);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  const handleManualRedirect = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <SEO 
        title="Confirmação de Email - BroFit"
        description="Confirmação de email do BroFit"
      />
      
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Confirmando seu email...</h1>
              <p className="text-muted-foreground">
                Aguarde enquanto confirmamos sua conta
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Email confirmado com sucesso! 🎉</h1>
              <p className="text-muted-foreground">
                Sua conta foi ativada. Bem-vindo ao BroFit!
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Redirecionando automaticamente em <span className="font-semibold text-primary">{countdown}</span> segundos...
                </p>
              </div>

              <Button onClick={handleManualRedirect} className="w-full">
                Ir para o App agora
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Erro na confirmação</h1>
              <p className="text-muted-foreground">
                Não foi possível confirmar seu email. O link pode ter expirado.
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={handleManualRedirect} className="w-full">
                Voltar ao App
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth', { replace: true })}
                className="w-full"
              >
                Fazer login novamente
              </Button>
            </div>
          </>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            BroFit - Seu companheiro de treino
          </p>
        </div>
      </Card>
    </div>
  );
};

export default EmailConfirmation;