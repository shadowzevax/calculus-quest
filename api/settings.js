import { sql } from './_db.js';
import { requireAuth, requireAdmin } from './_auth.js';
import { getCurrentCode, regenerateCode, REG_CODE_ROTATE_MS } from './_regcode.js';

export default async function handler(req, res) {
  if (req.query.action === 'reg_code' && req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const state = await getCurrentCode(sql);
    return res.status(200).json({ code: state.code, expires_at: state.generated_at + REG_CODE_ROTATE_MS });
  }

  if (req.query.action === 'reg_code' && req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const state = await regenerateCode(sql);
    return res.status(200).json({ code: state.code, expires_at: state.generated_at + REG_CODE_ROTATE_MS });
  }

  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const rows = await sql`SELECT key, value FROM app_settings`;
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return res.status(200).json(settings);
  }

  if (req.method === 'PATCH') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key requerido' });
    await sql`
      INSERT INTO app_settings (key, value) VALUES (${key}, ${String(value)})
      ON CONFLICT (key) DO UPDATE SET value = ${String(value)}
    `;
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
