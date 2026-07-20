import { sql } from '../_db.js';
import { getUserFromRequest } from '../_auth.js';

export default async function handler(req, res) {
  const authUser = getUserFromRequest(req);
  if (!authUser) return res.status(401).json({ error: 'No autenticado' });

  const [user] = await sql`
    SELECT id, email, full_name, role, avatar, bio, xp, level, streak_days
    FROM users WHERE id = ${authUser.id}
  `;
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  res.status(200).json({ user });
}
