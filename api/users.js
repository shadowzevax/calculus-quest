import { sql } from './_db.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT id, email, full_name, role, xp, level, avatar, created_at
      FROM users ORDER BY created_at DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'PATCH') {
    const { id, role } = req.body || {};
    if (!id || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'id y role (user|admin) requeridos' });
    }
    const [updated] = await sql`UPDATE users SET role = ${role} WHERE id = ${id} RETURNING id, email, role`;
    return res.status(200).json({ user: updated });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
