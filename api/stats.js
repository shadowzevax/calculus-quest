import { sql } from './_db.js';
import { requireAdmin } from './_auth.js';

// Panel de analitica por estudiante para el docente (Objetivo 3): desempeño, tiempo y
// encuesta de percepcion, todo con datos reales de uso de la plataforma (no de ejemplo) —
// sirve tanto para ver en pantalla como para exportar a CSV. El pre-test/post-test se
// hace por Google Forms, fuera de la plataforma, así que no vive aquí.
//
// Todas las consultas de este archivo excluyen users.is_test_account = true (las cuentas
// "Test Estudiante"/"Test Docente" que usa el equipo para probar la plataforma) — sin este
// filtro, sus intentos y su respuesta a la encuesta SUS contaminarían los números reales del
// curso una vez que estudiantes de verdad empiecen a usarla.
async function handleAnalytics(req, res) {
  const students = await sql`
    SELECT
      u.id, u.full_name, u.email, u.xp, u.level, u.created_at,
      COALESCE(mc.completed, 0)::int AS missions_completed,
      COALESCE(mc.total_time, 0)::int AS total_time_seconds,
      COALESCE(ea.attempts, 0)::int AS exercise_attempts,
      COALESCE(ea.correct, 0)::int AS exercise_correct
    FROM users u
    LEFT JOIN LATERAL (
      SELECT COUNT(*) FILTER (WHERE status = 'completed') AS completed, SUM(time_spent) AS total_time
      FROM user_progress WHERE user_id = u.id
    ) mc ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS attempts, COUNT(*) FILTER (WHERE is_correct) AS correct
      FROM exercise_attempts WHERE user_id = u.id
    ) ea ON true
    WHERE u.role = 'user' AND u.is_test_account = false
    ORDER BY u.full_name ASC
  `;
  // Se excluyen las cuentas de prueba del propio equipo (is_test_account) — de lo contrario
  // sus respuestas a la encuesta contaminarían el puntaje SUS real del curso.
  const surveyRows = await sql`
    SELECT sr.user_id, sq."order", sq.text, (sr.answers->>sq.id::text)::int AS value
    FROM survey_responses sr
    JOIN users u ON u.id = sr.user_id AND u.is_test_account = false
    CROSS JOIN survey_questions sq
  `;

  // Dificultad por misión: cuánto se intenta cada una y qué tan seguido se acierta, a partir
  // de exercise_attempts (ya se guardaba un intento por cada ejercicio resuelto o fallado en
  // las 13 misiones normales; la Misión 10/ruleta se sumó a esto el 2026-09-20, antes sus
  // fallos no dejaban ningún rastro). Sirve para que el docente vea de un vistazo qué misión le
  // cuesta más al curso — deliberadamente en términos genéricos y reutilizables (nunca se
  // menciona aquí un pre-test/post-test ni nada específico de una investigación puntual: esta
  // pantalla es del producto, no de un estudio).
  const missionDifficulty = await sql`
    SELECT
      m.id, m."order", m.title,
      COUNT(*)::int AS attempts,
      COUNT(*) FILTER (WHERE ea.is_correct)::int AS correct,
      ROUND(AVG(ea.time_taken) FILTER (WHERE ea.time_taken IS NOT NULL))::int AS avg_time_seconds
    FROM missions m
    JOIN exercises e ON e.mission_id = m.id AND e.parent_exercise_id IS NULL AND e.is_active = true
    JOIN exercise_attempts ea ON ea.exercise_id = e.id
    JOIN users u ON u.id = ea.user_id AND u.role = 'user' AND u.is_test_account = false
    WHERE m.module = 'misiones' AND m.is_active = true
    GROUP BY m.id, m."order", m.title
    ORDER BY m."order" ASC
  `;

  if (req.query.format === 'csv') {
    const header = ['Nombre', 'Correo', 'XP', 'Nivel', 'Misiones completadas', 'Tiempo total (s)', 'Ejercicios intentados', 'Ejercicios correctos'];
    const lines = [header.join(',')];
    for (const s of students) {
      lines.push([
        `"${(s.full_name || '').replace(/"/g, '""')}"`,
        s.email, s.xp, s.level, s.missions_completed, s.total_time_seconds,
        s.exercise_attempts, s.exercise_correct,
      ].join(','));
    }
    lines.push('');
    lines.push(['Misión', 'Intentos registrados', 'Aciertos', '% de acierto', 'Tiempo promedio (s)'].join(','));
    for (const m of missionDifficulty) {
      const pct = m.attempts ? Math.round((m.correct / m.attempts) * 100) : '';
      lines.push([
        `"${(m.title || '').replace(/"/g, '""')}"`,
        m.attempts, m.correct, pct, m.avg_time_seconds ?? '',
      ].join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="funcionlab-analitica.csv"');
    return res.status(200).send('﻿' + lines.join('\n'));
  }

  return res.status(200).json({ students, surveyRows, missionDifficulty });
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.query.action === 'analytics') return handleAnalytics(req, res);

  const [{ count: totalStudents }] = await sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'user' AND is_test_account = false`;
  const [{ count: activeStudents }] = await sql`
    SELECT COUNT(DISTINCT up.user_id)::int AS count
    FROM user_progress up JOIN users u ON u.id = up.user_id
    WHERE u.role = 'user' AND u.is_test_account = false
  `;
  const [{ count: totalMissions }] = await sql`SELECT COUNT(*)::int AS count FROM missions WHERE is_active = true`;

  res.status(200).json({
    totalStudents,
    activeStudents,
    totalMissions,
  });
}
