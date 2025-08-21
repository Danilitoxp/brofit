import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePWA } from '@/hooks/usePWA';

const INSTALL_PROMPT_DISMISSED_KEY = 'brofit-install-prompt-dismissed';

export const InstallPrompt = () => {
  const { isInstallable, isInstalled, installApp, getInstallInstructions } = usePWA();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
    if (isDismissed) {
      setShowPrompt(false);
    }
  }, []);

  const instructions = getInstallInstructions();
  const isIOS = instructions.platform === 'iOS';

  if (isInstalled || !showPrompt) return null;

  const handleInstall = async () => {
    if (isInstallable) {
      const success = await installApp();
      if (!success) {
        setShowInstructions(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
    setShowPrompt(false);
  };

  return (
    <>
      {/* Install Banner */}
      <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-gradient-primary text-primary-foreground shadow-xl border-0 lg:left-auto lg:right-4 lg:w-96">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Smartphone className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Instalar BroFit</h3>
            <p className="text-xs opacity-90">
              Acesse rapidamente seus treinos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              className="bg-white text-primary hover:bg-white/90"
            >
              <Download className="w-4 h-4 mr-1" />
              Instalar
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {instructions.platform === 'iOS' ? (
                <Share className="w-5 h-5" />
              ) : instructions.platform === 'Android' ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <Monitor className="w-5 h-5" />
              )}
              Como instalar no {instructions.platform}
            </DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para instalar o BroFit:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs p-0">
                  {index + 1}
                </Badge>
                <p className="text-sm flex-1">{step}</p>
              </div>
            ))}
          </div>

          {isIOS && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Dica:</strong> O ícone de compartilhamento é uma caixa com uma seta para cima, localizado na parte inferior da tela no Safari.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setShowInstructions(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};