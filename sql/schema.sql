-- Calculus Quest - esquema Neon Postgres
-- Se ejecutó una vez en el SQL Editor de Neon para crear las tablas.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- da gen_random_uuid() para los ids

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar TEXT,
  bio TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  story TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'facil',
  "order" INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  required_level INTEGER DEFAULT 1,
  estimated_time INTEGER,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT DEFAULT '#457B9D',
  module TEXT DEFAULT 'misiones',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  parent_exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  question TEXT,
  type TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  hint TEXT,
  difficulty TEXT DEFAULT 'facil',
  xp_value INTEGER DEFAULT 10,
  "order" INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Award', -- ya no se usa (quedó de una version anterior con iconos de Lucide)
  color TEXT DEFAULT '#F4A261', -- ya no se usa
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  rarity TEXT DEFAULT 'comun'
);
-- Imagen real de la insignia (SVG/WebP diseñados a mano), servida desde /public/badges/.
-- Las 8 insignias actuales se reparten cada 2 misiones (2, 4, 6... hasta la 14, la última,
-- que además desbloquea el nombre arcoíris) — ver api/_badges.js.
ALTER TABLE badges ADD COLUMN IF NOT EXISTS image TEXT;

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started',
  progress_percentage NUMERIC DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  completed_date TIMESTAMPTZ,
  started_date TIMESTAMPTZ,
  UNIQUE (user_id, mission_id)
);

-- Nombre arcoiris animado: la única forma de cambiar el color del nombre, recompensa
-- maxima que solo se puede activar tras ganar la insignia "Leyenda de FuncionLab"
-- (completar las 14 misiones, incluida la ultima).
ALTER TABLE users ADD COLUMN IF NOT EXISTS name_rainbow BOOLEAN NOT NULL DEFAULT false;
-- Burbuja de chat oscura (en vez del naranja por defecto): se desbloquea en la
-- penultima insignia (mision 13, "Optimizador Experto"). A diferencia de las demas
-- recompensas, esta cambia como TODOS ven los mensajes de ese usuario, no solo el.
ALTER TABLE users ADD COLUMN IF NOT EXISTS dark_bubble BOOLEAN NOT NULL DEFAULT false;
-- Aro/resplandor naranja animado alrededor de la foto de perfil: se desbloquea en la
-- mision 12 ("Domador de Derivadas"). Visible para todos en Ranking, Perfil y la barra lateral.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_glow BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_date TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Insignia "equipada" (su ícono se muestra junto al nombre en ranking/chat): se pueden
-- llevar puestas 0, algunas o las 8 a la vez, en el orden en que se equiparon.
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS equipped_at TIMESTAMPTZ;

CREATE TABLE exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  answer_given TEXT,
  is_correct BOOLEAN NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  time_taken INTEGER,
  hint_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  user_email TEXT,
  severity TEXT DEFAULT 'info',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT,
  mission_id UUID REFERENCES missions(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  replies_count INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT,
  content TEXT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_mission ON exercises(mission_id);
CREATE INDEX idx_exercises_parent ON exercises(parent_exercise_id);
CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_attempts_user_exercise ON exercise_attempts(user_id, exercise_id);
CREATE INDEX idx_missions_module_order ON missions(module, "order");
