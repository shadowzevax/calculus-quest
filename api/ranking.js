import { sql } from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  // Desempate cuando dos estudiantes tienen el mismo XP: gana quien tenga mejor (menor)
  // tiempo en el Sistema 6 (desafio de memoria de la mision cooperativa) — no otorga XP
  // ni insignia, solo ordena el ranking. Quien nunca lo jugó queda detrás en el empate.
  const rows = await sql`
    SELECT u.id, u.full_name, u.avatar, u.avatar_config, u.xp, u.level, u.name_rainbow, u.avatar_glow,
           COALESCE(eb.images, '{}') AS equipped_badge_images
    FROM users u
    LEFT JOIN LATERAL (
      SELECT array_agg(b.image ORDER BY ub.equipped_at) AS images
      FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = u.id AND ub.equipped_at IS NOT NULL
    ) eb ON true
    WHERE u.role = 'user'
    ORDER BY u.xp DESC, u.speed_challenge_ms ASC NULLS LAST, u.created_at ASC LIMIT 50
  `;
  res.status(200).json(rows);
}
