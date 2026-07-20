import { sql } from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const rows = await sql`
    SELECT id, full_name, avatar, xp, level
    FROM users WHERE role = 'user'
    ORDER BY xp DESC LIMIT 50
  `;
  res.status(200).json(rows);
}
