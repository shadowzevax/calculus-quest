import { sql } from './_db.js';
import { requireAdmin } from './_auth.js';

// Panel de analitica por estudiante para el docente (Objetivo 3): desempeño, tiempo y
// encuesta de percepcion, todo con datos reales de uso de la plataforma (no de ejemplo) —
// sirve tanto para ver en pantalla como para exportar a CSV. El pre-test/post-test se
// hace por Google Forms, fuera de la plataforma, así que no vive aquí.
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
    WHERE u.role = 'user'
    ORDER BY u.full_name ASC
  `;
  const surveyRows = await sql`
    SELECT sr.user_id, sq."order", sq.text, (sr.answers->>sq.id::text)::int AS value
    FROM survey_responses sr, survey_questions sq
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
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="funcionlab-analitica.csv"');
    return res.status(200).send('﻿' + lines.join('\n'));
  }

  return res.status(200).json({ students, surveyRows });
}

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.query.action === 'analytics') return handleAnalytics(req, res);

  const [{ count: totalStudents }] = await sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'user'`;
  const [{ count: activeStudents }] = await sql`
    SELECT COUNT(DISTINCT user_id)::int AS count FROM user_progress
  `;
  const [{ count: totalMissions }] = await sql`SELECT COUNT(*)::int AS count FROM missions WHERE is_active = true`;

  res.status(200).json({
    totalStudents,
    activeStudents,
    totalMissions,
  });
}
