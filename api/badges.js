import { sql } from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT b.*, ub.earned_date, ub.equipped_at
      FROM badges b
      LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ${user.id}
      ORDER BY b.requirement_value ASC NULLS LAST
    `;
    // El docente no "juega", así que ve todas las insignias ya desbloqueadas
    // (puede usarlas para mostrarle a los estudiantes cómo se ven, sin tener que jugar la plataforma).
    const isTeacher = user.role === 'admin';
    return res.status(200).json(
      rows.map((b) => ({ ...b, earned: isTeacher || !!b.earned_date, equipped: !!b.equipped_at }))
    );
  }

  if (req.method === 'POST') {
    // Equipar/desequipar una insignia (se pueden llevar puestas 0, algunas o todas a la vez).
    const { badge_id } = req.body || {};
    if (!badge_id) return res.status(400).json({ error: 'badge_id requerido' });

    const isTeacher = user.role === 'admin';
    const [existing] = await sql`SELECT equipped_at FROM user_badges WHERE user_id = ${user.id} AND badge_id = ${badge_id}`;

    if (!existing) {
      if (!isTeacher) return res.status(403).json({ error: 'Esa insignia no ha sido desbloqueada' });
      // El docente puede "tener" cualquier insignia bajo demanda, sin haberla jugado.
      await sql`INSERT INTO user_badges (user_id, badge_id, equipped_at) VALUES (${user.id}, ${badge_id}, now())`;
    } else if (existing.equipped_at) {
      await sql`UPDATE user_badges SET equipped_at = NULL WHERE user_id = ${user.id} AND badge_id = ${badge_id}`;
    } else {
      await sql`UPDATE user_badges SET equipped_at = now() WHERE user_id = ${user.id} AND badge_id = ${badge_id}`;
    }
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
