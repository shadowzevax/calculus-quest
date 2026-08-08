import { sql } from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const rows = await sql`
    SELECT u.id, u.full_name, u.avatar, u.xp, u.level, u.name_rainbow,
           b.image AS badge_image, b.name AS badge_name
    FROM users u
    LEFT JOIN badges b ON b.id = u.equipped_badge_id
    WHERE u.role = 'user'
    ORDER BY u.xp DESC LIMIT 50
  `;
  res.status(200).json(rows);
}
