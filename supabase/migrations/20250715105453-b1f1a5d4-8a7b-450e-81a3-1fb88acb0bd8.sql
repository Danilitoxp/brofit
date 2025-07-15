-- Adicionar campo nickname obrigatório na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN nickname TEXT UNIQUE;

-- Adicionar campo role na tabela profiles  
ALTER TABLE public.profiles 
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Criar tabela de exercícios personalizados
CREATE TABLE public.custom_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  image_url TEXT,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela custom_exercises
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

-- Política para que todos possam ver exercícios ativos
CREATE POLICY "Todos podem ver exercícios ativos" 
ON public.custom_exercises 
FOR SELECT 
USING (is_active = true);

-- Política para que apenas admins possam criar exercícios
CREATE POLICY "Apenas admins podem criar exercícios" 
ON public.custom_exercises 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para que apenas admins possam atualizar exercícios
CREATE POLICY "Apenas admins podem atualizar exercícios" 
ON public.custom_exercises 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para que apenas admins possam deletar exercícios
CREATE POLICY "Apenas admins podem deletar exercícios" 
ON public.custom_exercises 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_custom_exercises_updated_at
BEFORE UPDATE ON public.custom_exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND role = 'admin'
  );
$$;