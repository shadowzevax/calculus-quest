import { sql } from './_db.js';
import { requireAuth, requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const rows = await sql`
      SELECT m.*, u.name_rainbow, u.dark_bubble, u.avatar_glow, u.avatar, u.avatar_config, COALESCE(eb.images, '{}') AS equipped_badge_images
      FROM messages m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN LATERAL (
        SELECT array_agg(b.image ORDER BY ub.equipped_at) AS images
        FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
        WHERE ub.user_id = m.user_id AND ub.equipped_at IS NOT NULL
      ) eb ON true
      ORDER BY m.created_at ASC LIMIT 100
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;

    const [setting] = await sql`SELECT value FROM app_settings WHERE key = 'chat_enabled'`;
    if (setting?.value === 'false' && user.role !== 'admin') {
      return res.status(403).json({ error: 'El chat está desactivado por el docente' });
    }

    const { content } = req.body || {};
    if (!content || !content.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

    const [dbUser] = await sql`SELECT full_name FROM users WHERE id = ${user.id}`;
    const [msg] = await sql`
      INSERT INTO messages (user_id, author_name, role, content)
      VALUES (${user.id}, ${dbUser?.full_name || 'Usuario'}, ${user.role}, ${content.trim()})
      RETURNING *
    `;
    return res.status(201).json(msg);
  }

  if (req.method === 'DELETE') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    await sql`DELETE FROM messages`;
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
