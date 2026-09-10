-- NOTA (2026-09-10): este archivo originalmente tambien creaba diagnostic_questions y
-- diagnostic_attempts (pre-test/post-test). Nunca se integraron al flujo real de la
-- plataforma (diagnostic_attempts quedo siempre en 0 filas) y se eliminaron de la base de
-- datos y de este archivo durante la auditoria general. La evaluacion real de percepcion
-- es la encuesta SUS de abajo.

-- Encuesta de usabilidad SUS (System Usability Scale, Brooke 1986), aplicada al finalizar,
-- solo para quienes SI usaron la plataforma (grupo experimental). Escala Likert 1-5.
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
