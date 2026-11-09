import { sql } from './_db.js';
import { requireAdmin, isEvaluationAccount } from './_auth.js';

// GET es público (cualquiera ve las misiones), PATCH exige rol admin.
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const module = req.query.module || 'misiones';
    const rows = await sql`
      SELECT m.*, (
        SELECT COALESCE(SUM(e.xp_value), 0)::int FROM exercises e
        WHERE e.mission_id = m.id AND e.parent_exercise_id IS NULL AND e.is_active = true
      ) AS xp_total
      FROM missions m WHERE m.module = ${module} AND m.is_active = true ORDER BY m."order" ASC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'PATCH') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    if (isEvaluationAccount(admin)) {
      return res.status(403).json({ error: 'Cuenta de evaluación: editar misiones está deshabilitado para no alterar la plataforma con la que se hizo el estudio.' });
    }
    const { id, title, description, difficulty, xp_reward, estimated_time, is_active } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id requerido' });

    const [updated] = await sql`
      UPDATE missions SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        difficulty = COALESCE(${difficulty}, difficulty),
        xp_reward = COALESCE(${xp_reward}, xp_reward),
        estimated_time = COALESCE(${estimated_time}, estimated_time),
        is_active = COALESCE(${is_active}, is_active)
      WHERE id = ${id}
      RETURNING *
    `;
    return res.status(200).json({ mission: updated });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
