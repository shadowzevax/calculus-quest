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
  icon TEXT DEFAULT 'Award',
  color TEXT DEFAULT '#F4A261',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  rarity TEXT DEFAULT 'comun'
);

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

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
