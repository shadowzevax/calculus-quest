// GET: progreso del usuario por misión. POST: registra un intento de
// ejercicio y, si aplica, suma XP y recalcula el % de avance.
import { sql } from './_db.js';
import { requireAuth } from './_auth.js';
import { checkAndAwardBadges } from './_badges.js';
import { checkAndUnlockAvatarPieces, incrementSpeedBonusCount } from './_avatar.js';

// Debe coincidir con BONUS_XP en src/pages/MissionDetail.jsx.
const BONUS_XP = 5;

function normalizeText(str) {
  return String(str).trim().toLowerCase().replace(/\s+/g, '');
}

// Recalcula si las respuestas REALMENTE dadas (answers, mandadas por el cliente junto con el
// intento) serían correctas para este ejercicio — replica del lado servidor la misma lógica de
// corrección que ya usa src/lib/exerciseItems.js / MatchingExercise.jsx del lado cliente. Antes
// is_correct/xp_earned llegaban del cliente sin ninguna validación: cualquiera podía llamar esta
// API directo con is_correct:true y xp_earned inventado sin haber resuelto nada. Ahora el
// servidor decide por su cuenta a partir de exercise.metadata + answers; is_correct/xp_earned
// que manda el cliente ya no se usan para nada.
function evaluateAnswers(exercise, answers) {
  const meta = exercise.metadata || {};

  if (exercise.type === 'matching') {
    const pairs = meta.pairs || [];
    if (!pairs.length) return { isCorrect: false };
    const connections = answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {};
    const correctCount = pairs.filter((_, i) => connections[i] === i).length;
    return { isCorrect: correctCount === pairs.length };
  }

  let kind = null;
  let list = null;
  const threshold = 0.6;
  if (Array.isArray(meta.questions) && meta.questions.length) {
    kind = 'choice';
    list = meta.questions.map((q) => ({ correctIndex: q.correct_index }));
  } else if (Array.isArray(meta.statements) && meta.statements.length) {
    kind = 'choice';
    list = meta.statements.map((s) => ({ correctIndex: s.answer ? 0 : 1 }));
  } else if (Array.isArray(meta.problems) && meta.problems.length) {
    kind = 'text';
    list = meta.problems.map((p) => ({
      accepted: [p.answer, ...(Array.isArray(p.accepted_answers) ? p.accepted_answers : [])],
      answer: p.answer,
      tolerance: p.tolerance,
    }));
  }
  if (!list || !list.length) return { isCorrect: false };

  // Puede haber varios intentos para la misma sub-pregunta (reintentos) — se toma el ÚLTIMO
  // valor mandado por cada índice, que es el intento final del estudiante.
  const finalByIndex = new Map();
  (Array.isArray(answers) ? answers : []).forEach((a) => {
    if (a && typeof a.index === 'number') finalByIndex.set(a.index, a.value);
  });

  let correctCount = 0;
  list.forEach((item, i) => {
    const value = finalByIndex.get(i);
    if (value === undefined) return;
    if (kind === 'choice') {
      if (value === item.correctIndex) correctCount++;
      return;
    }
    let ok = item.accepted.some((a) => normalizeText(a) === normalizeText(value));
    if (!ok && item.tolerance !== undefined) {
      const num = parseFloat(String(value).replace(',', '.'));
      const target = parseFloat(item.answer);
      if (!isNaN(num) && !isNaN(target) && Math.abs(num - target) <= item.tolerance) ok = true;
    }
    if (ok) correctCount++;
  });

  return { isCorrect: correctCount / list.length >= threshold };
}

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
    const { exercise_id, answer_given, hint_used, answers, within_budget } = req.body || {};
    if (!exercise_id) return res.status(400).json({ error: 'exercise_id requerido' });

    const [exercise] = await sql`SELECT * FROM exercises WHERE id = ${exercise_id}`;
    if (!exercise) return res.status(404).json({ error: 'Ejercicio no existe' });

    // is_correct/xp_earned se recalculan aquí, del lado servidor, a partir de las respuestas
    // realmente dadas (answers) contra exercise.metadata — nunca se confía en lo que mande el
    // cliente para decidir esto (antes cualquiera podía llamar esta API directo con
    // is_correct:true y xp_earned inventado sin haber resuelto nada).
    const { isCorrect } = evaluateAnswers(exercise, answers);
    const bonus = isCorrect && within_budget ? BONUS_XP : 0;
    const xpEarned = isCorrect ? (exercise.xp_value || 10) + bonus : 0;

    await sql`
      INSERT INTO exercise_attempts (user_id, exercise_id, answer_given, is_correct, xp_earned, hint_used)
      VALUES (${user.id}, ${exercise_id}, ${answer_given || ''}, ${isCorrect}, ${xpEarned}, ${!!hint_used})
    `;

    if (isCorrect) {
      // El XP solo se otorga la primera vez que se acierta este ejercicio.
      const priorCorrect = await sql`
        SELECT id FROM exercise_attempts
        WHERE user_id = ${user.id} AND exercise_id = ${exercise_id} AND is_correct = true
      `;
      const firstTime = priorCorrect.length <= 1;

      if (firstTime && xpEarned) {
        await sql`UPDATE users SET xp = xp + ${xpEarned} WHERE id = ${user.id}`;
        if (bonus > 0) await incrementSpeedBonusCount(user.id);
      }

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

    const newBadges = isCorrect ? await checkAndAwardBadges(user.id) : [];
    const newAvatarPieces = isCorrect ? await checkAndUnlockAvatarPieces(user.id) : [];

    return res.status(200).json({ ok: true, new_badges: newBadges, new_avatar_pieces: newAvatarPieces });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
