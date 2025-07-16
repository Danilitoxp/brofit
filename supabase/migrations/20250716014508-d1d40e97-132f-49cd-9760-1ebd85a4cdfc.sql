-- Inserir conquistas temáticas de academia no banco de dados
INSERT INTO public.achievements (name, description, category, icon, requirement_type, requirement_value) VALUES
  ('Primeiro Dia', 'Completou seu primeiro treino!', 'treinos', '🥇', 'total_workouts', 1),
  ('Iniciante', 'Completou 7 treinos', 'treinos', '🏋️‍♂️', 'total_workouts', 7),
  ('Rato de Academia', 'Completou 30 treinos', 'treinos', '🐭', 'total_workouts', 30),
  ('Guerreiro', 'Completou 100 treinos', 'treinos', '⚔️', 'total_workouts', 100),
  ('Lenda', 'Completou 365 treinos', 'treinos', '👑', 'total_workouts', 365),
  
  ('Sequência Iniciante', '3 dias seguidos treinando', 'sequencia', '🔥', 'current_streak', 3),
  ('Sequência Guerreiro', '7 dias seguidos treinando', 'sequencia', '🚀', 'current_streak', 7),
  ('Sequência Lenda', '30 dias seguidos treinando', 'sequencia', '💎', 'current_streak', 30),
  
  ('Frango', 'Levantou 10 toneladas no total', 'peso', '🐔', 'total_weight', 10000),
  ('Marombeiro', 'Levantou 40 toneladas no total', 'peso', '💪', 'total_weight', 40000),
  ('Monstro', 'Levantou 100 toneladas no total', 'peso', '👹', 'total_weight', 100000),
  ('Hércules', 'Levantou 500 toneladas no total', 'peso', '🦍', 'total_weight', 500000);