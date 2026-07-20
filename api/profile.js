import { sql } from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const { full_name, bio, avatar } = req.body || {};
  const [updated] = await sql`
    UPDATE users SET
      full_name = COALESCE(${full_name}, full_name),
      bio = COALESCE(${bio}, bio),
      avatar = COALESCE(${avatar}, avatar)
    WHERE id = ${user.id}
    RETURNING id, email, full_name, role, avatar, bio, xp, level
  `;
  res.status(200).json({ user: updated });
}
