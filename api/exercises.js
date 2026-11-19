import { sql } from './_db.js';
import { requireAuth } from './_auth.js';
import { isMissionUnlocked } from './_unlock.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = requireAuth(req, res);
  if (!user) return;
  const { mission_id } = req.query;
  if (!mission_id) return res.status(400).json({ error: 'mission_id requerido' });
  // Un id mal formado hacía fallar la consulta con un error 500 en vez de una respuesta clara.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(mission_id))) {
    return res.status(400).json({ error: 'mission_id no válido' });
  }
  if (!(await isMissionUnlocked(user, mission_id))) {
    return res.status(403).json({ error: 'Esta misión todavía está bloqueada: completa primero la misión anterior.', locked: true });
  }

  // parent_exercise_id IS NULL: solo los ejercicios "principales" de la misión.
  const rows = await sql`
    SELECT * FROM exercises
    WHERE mission_id = ${mission_id} AND parent_exercise_id IS NULL AND is_active = true
    ORDER BY "order" ASC
  `;
  res.status(200).json(rows);
}
