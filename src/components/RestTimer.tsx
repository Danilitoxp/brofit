import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Timer, Pause, Play, SkipForward } from 'lucide-react';

interface RestTimerProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: () => void;
  duration?: number; // em segundos, padrão 90s
}

export const RestTimer = ({ isVisible, onClose, onComplete, duration = 90 }: RestTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isVisible && !hasStarted) {
      setTimeLeft(duration);
      setIsRunning(true);
      setHasStarted(true);
    }
  }, [isVisible, duration, hasStarted]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && timeLeft > 0 && isVisible) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            onComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, onComplete, isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setHasStarted(false);
      setIsRunning(false);
    }
  }, [isVisible]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="floating-card bg-gradient-primary p-6 w-full max-w-sm">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Timer className="text-primary-foreground" size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-primary-foreground mb-2">
            Tempo de Descanso
          </h3>
          
          <div className="text-6xl font-mono font-bold text-primary-foreground mb-4">
            {formatTime(timeLeft)}
          </div>
          
          <Progress 
            value={progress} 
            className="mb-6 h-2"
          />
          
          <div className="flex gap-3 justify-center">
            <Button
              variant="glass"
              size="icon"
              onClick={() => setIsRunning(!isRunning)}
              className="text-primary-foreground border-primary-foreground/20"
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            
            <Button
              variant="glass"
              size="icon"
              onClick={onComplete}
              className="text-primary-foreground border-primary-foreground/20"
            >
              <SkipForward size={20} />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="mt-4 text-primary-foreground/80 hover:text-primary-foreground"
          >
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  );
};