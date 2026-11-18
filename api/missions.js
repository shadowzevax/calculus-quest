import { sql } from './_db.js';

// Solo lectura: las misiones son fijas (no se editan desde la plataforma).
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

  res.status(405).json({ error: 'Method not allowed' });
}
