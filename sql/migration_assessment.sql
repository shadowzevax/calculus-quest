-- Pre-test/post-test diagnostico y encuesta de percepcion (Objetivo 3 de la tesis).
-- Las mismas 12 preguntas diagnosticas se usan como "pre" (antes de empezar) y "post"
-- (al terminar), para poder comparar el mismo instrumento antes/despues.
CREATE TABLE diagnostic_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order" INTEGER NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- ["opcion a", "opcion b", "opcion c", "opcion d"]
  correct_index INTEGER NOT NULL
);

CREATE TABLE diagnostic_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('pre', 'post')),
  answers JSONB NOT NULL, -- { question_id: selected_index }
  score INTEGER NOT NULL, -- aciertos sobre el total de preguntas
  total INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, phase)
);

-- Encuesta de percepcion/motivacion, solo para quienes SI usaron la plataforma
-- (grupo experimental), aplicada al finalizar. Escala Likert 1-5.
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order" INTEGER NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  answers JSONB NOT NULL, -- { question_id: 1-5 }
  comment TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
