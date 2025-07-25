-- Criar bucket para exercícios se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exercise-images', 'exercise-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para upload de imagens de exercícios
CREATE POLICY "Admins podem fazer upload de imagens de exercícios"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Todos podem visualizar imagens de exercícios"
ON storage.objects
FOR SELECT
USING (bucket_id = 'exercise-images');

CREATE POLICY "Admins podem atualizar imagens de exercícios"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'exercise-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins podem deletar imagens de exercícios"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'exercise-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);