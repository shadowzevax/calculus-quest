import { sql } from './_db.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const module = req.query.module || 'misiones';
    const rows = await sql`
      SELECT * FROM missions WHERE module = ${module} AND is_active = true ORDER BY "order" ASC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'PATCH') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
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
