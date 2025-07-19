import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ExerciseProgressChart } from "@/components/ExerciseProgressChart";

const Progress = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">Evolução</h1>
          <p className="text-sm text-muted-foreground">
            Seu progresso e estatísticas
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Exercise Progress */}
      <ExerciseProgressChart />
    </div>
  );
};

export default Progress;