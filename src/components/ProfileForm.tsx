import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Profile } from "@/hooks/useProfile";

interface ProfileFormProps {
  profile: Profile | null;
  onSubmit: (profile: Partial<Profile>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' }
];

export const ProfileForm = ({ profile, onSubmit, onCancel, isLoading }: ProfileFormProps) => {
  const [formData, setFormData] = useState<Partial<Profile>>({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    height: profile?.height || undefined,
    weight: profile?.weight || undefined,
    fitness_goal: profile?.fitness_goal || "",
    experience_level: profile?.experience_level || undefined,
    is_public: profile?.is_public ?? true,
    birth_date: profile?.birth_date || undefined
  });

  const [birthDate, setBirthDate] = useState<Date | undefined>(
    profile?.birth_date ? new Date(profile.birth_date) : undefined
  );

  const handleInputChange = (field: keyof Profile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setBirthDate(date);
    setFormData(prev => ({ 
      ...prev, 
      birth_date: date ? format(date, 'yyyy-MM-dd') : undefined 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="floating-card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome de exibição */}
          <div className="space-y-2">
            <Label htmlFor="display_name">Nome de exibição</Label>
            <Input
              id="display_name"
              value={formData.display_name || ""}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              placeholder="Como você quer ser chamado"
            />
          </div>

          {/* Nível de experiência */}
          <div className="space-y-2">
            <Label>Nível de experiência</Label>
            <Select 
              value={formData.experience_level || ""} 
              onValueChange={(value) => handleInputChange('experience_level', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu nível" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Biografia</Label>
          <Textarea
            id="bio"
            value={formData.bio || ""}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Conte um pouco sobre você e seus objetivos..."
            rows={3}
          />
        </div>

        {/* Data de nascimento */}
        <div className="space-y-2">
          <Label>Data de nascimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !birthDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {birthDate ? (
                  format(birthDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={birthDate}
                onSelect={handleDateSelect}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Altura */}
          <div className="space-y-2">
            <Label htmlFor="height">Altura (cm)</Label>
            <Input
              id="height"
              type="number"
              min="100"
              max="250"
              value={formData.height || ""}
              onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || undefined)}
              placeholder="Ex: 175"
            />
          </div>

          {/* Peso */}
          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              min="30"
              max="300"
              step="0.1"
              value={formData.weight || ""}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || undefined)}
              placeholder="Ex: 70.5"
            />
          </div>
        </div>

        {/* Objetivo fitness */}
        <div className="space-y-2">
          <Label htmlFor="fitness_goal">Objetivo principal</Label>
          <Input
            id="fitness_goal"
            value={formData.fitness_goal || ""}
            onChange={(e) => handleInputChange('fitness_goal', e.target.value)}
            placeholder="Ex: Ganhar massa muscular, perder peso, etc."
          />
        </div>

        {/* Perfil público */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="is_public">Perfil público</Label>
            <p className="text-sm text-muted-foreground">
              Permitir que outros usuários vejam seu perfil e estatísticas
            </p>
          </div>
          <Switch
            id="is_public"
            checked={formData.is_public ?? true}
            onCheckedChange={(checked) => handleInputChange('is_public', checked)}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar alterações"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
};