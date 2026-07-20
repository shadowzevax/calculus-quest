import { sql } from './_db.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const [{ count: totalStudents }] = await sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'user'`;
  const [{ count: activeStudents }] = await sql`
    SELECT COUNT(DISTINCT user_id)::int AS count FROM user_progress
  `;
  const [{ count: totalMissions }] = await sql`SELECT COUNT(*)::int AS count FROM missions WHERE is_active = true`;

  res.status(200).json({
    totalStudents,
    activeStudents,
    totalMissions,
  });
}
