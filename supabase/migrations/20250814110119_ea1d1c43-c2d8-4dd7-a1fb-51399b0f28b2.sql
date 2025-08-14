-- Remover dependências da tabela exercise_records que não existe
-- A tabela exercise_records será criada para armazenar recordes de exercícios

CREATE TABLE public.exercise_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  max_weight NUMERIC NOT NULL DEFAULT 0,
  max_reps INTEGER NOT NULL DEFAULT 0,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exercise_records ENABLE ROW LEVEL SECURITY;

-- Create policies for exercise_records
CREATE POLICY "Users can view their own exercise records" 
ON public.exercise_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise records" 
ON public.exercise_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise records" 
ON public.exercise_records 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise records" 
ON public.exercise_records 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exercise_records_updated_at
BEFORE UPDATE ON public.exercise_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_exercise_records_user_id ON public.exercise_records(user_id);
CREATE INDEX idx_exercise_records_exercise_name ON public.exercise_records(exercise_name);
CREATE INDEX idx_exercise_records_max_weight ON public.exercise_records(max_weight DESC);