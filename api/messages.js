import { sql } from './_db.js';
import { requireAuth, requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const rows = await sql`SELECT * FROM messages ORDER BY created_at ASC LIMIT 100`;
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
