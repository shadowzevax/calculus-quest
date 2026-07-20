import { sql } from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM user_progress WHERE user_id = ${user.id}`;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { exercise_id, answer_given, is_correct, xp_earned, hint_used } = req.body || {};
    if (!exercise_id) return res.status(400).json({ error: 'exercise_id requerido' });

    const [exercise] = await sql`SELECT * FROM exercises WHERE id = ${exercise_id}`;
    if (!exercise) return res.status(404).json({ error: 'Ejercicio no existe' });

    await sql`
      INSERT INTO exercise_attempts (user_id, exercise_id, answer_given, is_correct, xp_earned, hint_used)
      VALUES (${user.id}, ${exercise_id}, ${answer_given || ''}, ${!!is_correct}, ${xp_earned || 0}, ${!!hint_used})
    `;

    if (is_correct) {
      const priorCorrect = await sql`
        SELECT id FROM exercise_attempts
        WHERE user_id = ${user.id} AND exercise_id = ${exercise_id} AND is_correct = true
      `;
      const firstTime = priorCorrect.length <= 1;

      if (firstTime && xp_earned) {
        await sql`UPDATE users SET xp = xp + ${xp_earned} WHERE id = ${user.id}`;
      }

      const [mission] = await sql`SELECT * FROM missions WHERE id = ${exercise.mission_id}`;
      const totalExercises = await sql`
        SELECT COUNT(*)::int AS count FROM exercises
        WHERE mission_id = ${exercise.mission_id} AND parent_exercise_id IS NULL AND is_active = true
      `;
      const completedDistinct = await sql`
        SELECT COUNT(DISTINCT exercise_id)::int AS count FROM exercise_attempts
        WHERE user_id = ${user.id} AND is_correct = true
          AND exercise_id IN (
            SELECT id FROM exercises WHERE mission_id = ${exercise.mission_id} AND parent_exercise_id IS NULL
          )
      `;
      const total = totalExercises[0].count || 1;
      const completed = Math.min(completedDistinct[0].count, total);
      const pct = Math.min(100, Math.round((completed / total) * 10000) / 100);
      const status = pct >= 100 ? 'completed' : 'in_progress';

      await sql`
        INSERT INTO user_progress (user_id, mission_id, status, progress_percentage, exercises_completed, total_exercises, started_date, completed_date)
        VALUES (${user.id}, ${exercise.mission_id}, ${status}, ${pct}, ${completed}, ${total}, now(), ${status === 'completed' ? sql`now()` : null})
        ON CONFLICT (user_id, mission_id) DO UPDATE SET
          status = ${status},
          progress_percentage = ${pct},
          exercises_completed = ${completed},
          total_exercises = ${total},
          completed_date = CASE WHEN ${status} = 'completed' THEN now() ELSE user_progress.completed_date END
      `;
    }

    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
