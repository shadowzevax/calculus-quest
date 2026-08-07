import { sql } from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const rows = await sql`
    SELECT b.*, ub.earned_date
    FROM badges b
    LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ${user.id}
    ORDER BY b.requirement_value ASC NULLS LAST
  `;
  // El docente no "juega", así que ve todas las insignias ya desbloqueadas
  // (puede usarlas para mostrarle a los estudiantes cómo se ven, sin tener que jugar la plataforma).
  const isTeacher = user.role === 'admin';
  res.status(200).json(rows.map((b) => ({ ...b, earned: isTeacher || !!b.earned_date })));
}
