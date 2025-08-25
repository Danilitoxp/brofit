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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, X, Camera, Upload } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Profile } from "@/hooks/useProfile";

interface ProfileFormProps {
  profile: Profile | null;
  onSubmit: (profile: Partial<Profile>) => void;
  onCancel: () => void;
  onAvatarUpload: (file: File) => Promise<string | null>;
  isLoading?: boolean;
}


export const ProfileForm = ({ profile, onSubmit, onCancel, onAvatarUpload, isLoading }: ProfileFormProps) => {
  const [formData, setFormData] = useState<Partial<Profile>>({
    display_name: profile?.display_name || "",
    nickname: profile?.nickname || "",
    bio: profile?.bio || "",
    height: profile?.height || undefined,
    weight: profile?.weight || undefined,
    fitness_goal: profile?.fitness_goal || "",
    
    is_public: profile?.is_public ?? true,
    birth_date: profile?.birth_date || undefined,
    avatar_url: profile?.avatar_url || ""
  });

  const [birthDate, setBirthDate] = useState<Date | undefined>(
    profile?.birth_date ? new Date(profile.birth_date) : undefined
  );

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleInputChange = (field: keyof Profile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const avatarUrl = await onAvatarUpload(file);
      if (avatarUrl) {
        handleInputChange('avatar_url', avatarUrl);
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
    
    // Validar nickname obrigatório
    if (!formData.nickname || formData.nickname.trim() === '') {
      alert('Nickname é obrigatório');
      return;
    }
    
    // Validar formato do nickname
    if (!/^[a-z0-9_]+$/.test(formData.nickname)) {
      alert('Nickname deve conter apenas letras minúsculas, números e underscore');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <Card className="floating-card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de Avatar */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="relative group">
                <Avatar className="w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                    {getInitials(formData.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </Label>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
            <p className="text-xs text-muted-foreground text-center">
              {isUploadingAvatar ? "Enviando..." : "Clique na foto para alterar"}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              JPG, PNG ou GIF até 5MB
            </p>
          </div>
        </div>

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

          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname *</Label>
            <Input
              id="nickname"
              value={formData.nickname || ""}
              onChange={(e) => handleInputChange('nickname', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="Ex: danilitoxp"
              required
              pattern="[a-z0-9_]+"
              title="Apenas letras minúsculas, números e underscore"
            />
            <p className="text-xs text-muted-foreground">
              Usado para busca de amigos. Apenas letras, números e underscore.
            </p>
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
          <Label htmlFor="birth_date">Data de nascimento</Label>
          <div className="flex gap-2">
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date || ""}
              onChange={(e) => {
                const dateValue = e.target.value;
                handleInputChange('birth_date', dateValue);
                setBirthDate(dateValue ? new Date(dateValue) : undefined);
              }}
              max={format(new Date(), 'yyyy-MM-dd')}
              min="1900-01-01"
              className="flex-1"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                >
                  <CalendarIcon className="h-4 w-4" />
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
          <p className="text-xs text-muted-foreground">
            Digite no formato DD/MM/AAAA ou use o calendário
          </p>
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