import { sql } from './_db.js';
import { requireAdmin } from './_auth.js';

const REQUIRED_ARRAY_FIELD = {
  multiple_choice: 'questions',
  fill_blank: 'problems',
  true_false: 'statements',
  matching: 'pairs',
};

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const exercises = await sql`
      SELECT e.id, e.question, e.type, e.metadata, e.is_active, m.title AS mission_title
      FROM exercises e
      LEFT JOIN missions m ON m.id = e.mission_id
      WHERE e.parent_exercise_id IS NULL
      ORDER BY m."order", e."order"
    `;

    const problems = [];
    for (const ex of exercises) {
      const field = REQUIRED_ARRAY_FIELD[ex.type];
      if (!field) {
        problems.push({ id: ex.id, mission: ex.mission_title, question: ex.question, reason: `Tipo desconocido: ${ex.type}` });
        continue;
      }
      const arr = ex.metadata?.[field];
      if (!Array.isArray(arr) || arr.length === 0) {
        problems.push({ id: ex.id, mission: ex.mission_title, question: ex.question, reason: `Falta contenido: "${field}" vacío o ausente` });
      }
    }

    return res.status(200).json({ totalScanned: exercises.length, problems });
  }

  if (req.method === 'PATCH') {
    // Desactivar ejercicios problemáticos por id
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids requerido' });
    await sql`UPDATE exercises SET is_active = false WHERE id = ANY(${ids})`;
    return res.status(200).json({ ok: true, disabled: ids.length });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
