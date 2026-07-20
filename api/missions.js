import { sql } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const module = req.query.module || 'misiones';
  const rows = await sql`
    SELECT * FROM missions WHERE module = ${module} AND is_active = true ORDER BY "order" ASC
  `;
  res.status(200).json(rows);
}
