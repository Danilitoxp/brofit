-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  birth_date DATE,
  height DECIMAL(5,2), -- em centímetros
  weight DECIMAL(5,2), -- em quilos
  fitness_goal TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver perfis públicos"
ON public.profiles
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu próprio perfil"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seu próprio perfil"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Criar tabela de estatísticas de treino
CREATE TABLE public.workout_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_workouts INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  total_weight_lifted DECIMAL(10,2) DEFAULT 0, -- em quilos
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS para workout_stats
ALTER TABLE public.workout_stats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para workout_stats
CREATE POLICY "Usuários podem ver estatísticas de perfis públicos"
ON public.workout_stats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = workout_stats.user_id 
    AND (profiles.is_public = true OR profiles.user_id = auth.uid())
  )
);

CREATE POLICY "Usuários podem criar suas próprias estatísticas"
ON public.workout_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias estatísticas"
ON public.workout_stats
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at nas tabelas
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_stats_updated_at
    BEFORE UPDATE ON public.workout_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.workout_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para melhor performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_public ON public.profiles(is_public);
CREATE INDEX idx_workout_stats_user_id ON public.workout_stats(user_id);