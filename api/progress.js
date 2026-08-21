// GET: progreso del usuario por misión. POST: registra un intento de
// ejercicio y, si aplica, suma XP y recalcula el % de avance.
import { sql } from './_db.js';
import { requireAuth } from './_auth.js';
import { checkAndAwardBadges } from './_badges.js';
import { checkAndUnlockAvatarPieces, incrementSpeedBonusCount } from './_avatar.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    if (req.query.recommend) {
      // Version reducida de "dificultad adaptativa": no cambia el contenido de los ejercicios,
      // solo sugiere repasar la mision anterior si el estudiante viene fallando mucho en la
      // mision pendiente actual — usa datos que ya existen (exercise_attempts), sin inventar
      // ejercicios nuevos ni cambiar cuales se muestran.
      const [pending] = await sql`
        SELECT m.id, m."order", m.title FROM missions m
        WHERE m.module = 'misiones' AND m.is_active = true
          AND NOT EXISTS (
            SELECT 1 FROM user_progress up
            WHERE up.user_id = ${user.id} AND up.mission_id = m.id AND up.progress_percentage >= 100
          )
        ORDER BY m."order" ASC LIMIT 1
      `;
      if (!pending || pending.order <= 1) return res.status(200).json(null);

      const [{ wrong_count }] = await sql`
        SELECT COUNT(*)::int AS wrong_count FROM exercise_attempts ea
        JOIN exercises e ON e.id = ea.exercise_id
        WHERE e.mission_id = ${pending.id} AND ea.user_id = ${user.id} AND ea.is_correct = false
      `;
      if (wrong_count < 3) return res.status(200).json(null);

      const [previous] = await sql`SELECT id, title FROM missions WHERE module = 'misiones' AND "order" = ${pending.order - 1}`;
      if (!previous) return res.status(200).json(null);

      return res.status(200).json({
        mission_id: previous.id,
        mission_title: previous.title,
        reason: `Has fallado varias veces en "${pending.title}" — puede ayudarte repasar "${previous.title}" primero.`,
      });
    }

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
      // El XP solo se otorga la primera vez que se acierta este ejercicio.
      const priorCorrect = await sql`
        SELECT id FROM exercise_attempts
        WHERE user_id = ${user.id} AND exercise_id = ${exercise_id} AND is_correct = true
      `;
      const firstTime = priorCorrect.length <= 1;

      if (firstTime && xp_earned) {
        await sql`UPDATE users SET xp = xp + ${xp_earned} WHERE id = ${user.id}`;
        // El bono de velocidad va incluido en xp_earned (base + 5) — si supera el valor base
        // del ejercicio, esta vez sí lo gano, y cuenta para desbloquear piezas del avatar.
        if (xp_earned > (exercise.xp_value || 0)) await incrementSpeedBonusCount(user.id);
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
      const completedDate = status === 'completed' ? new Date() : null;

      await sql`
        INSERT INTO user_progress (user_id, mission_id, status, progress_percentage, exercises_completed, total_exercises, started_date, completed_date)
        VALUES (${user.id}, ${exercise.mission_id}, ${status}, ${pct}, ${completed}, ${total}, now(), ${completedDate})
        ON CONFLICT (user_id, mission_id) DO UPDATE SET
          status = ${status},
          progress_percentage = ${pct},
          exercises_completed = ${completed},
          total_exercises = ${total},
          completed_date = CASE WHEN ${status} = 'completed' THEN now() ELSE user_progress.completed_date END
      `;
    }

    const newBadges = is_correct ? await checkAndAwardBadges(user.id) : [];
    const newAvatarPieces = is_correct ? await checkAndUnlockAvatarPieces(user.id) : [];

    return res.status(200).json({ ok: true, new_badges: newBadges, new_avatar_pieces: newAvatarPieces });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
