import { sql } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { mission_id } = req.query;
  if (!mission_id) return res.status(400).json({ error: 'mission_id requerido' });

  // parent_exercise_id IS NULL: solo los ejercicios "principales" de la misión.
  const rows = await sql`
    SELECT * FROM exercises
    WHERE mission_id = ${mission_id} AND parent_exercise_id IS NULL AND is_active = true
    ORDER BY "order" ASC
  `;
  res.status(200).json(rows);
}
