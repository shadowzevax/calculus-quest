// Revisa si el usuario cumple los requisitos de alguna insignia (badge) que
// todavía no tiene, y si es así la otorga. Se llama después de completar
// una misión, desde progress.js.
import { sql } from './_db.js';

export async function checkAndAwardBadges(userId) {
  const pending = await sql`
    SELECT b.* FROM badges b
    WHERE b.requirement_type = 'missions_completed'
      AND b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ${userId})
  `;
  if (pending.length === 0) return [];

  const [{ count: missionsCompleted }] = await sql`
    SELECT COUNT(*)::int AS count FROM user_progress
    WHERE user_id = ${userId} AND status = 'completed'
  `;

  const earned = pending.filter((b) => missionsCompleted >= b.requirement_value);

  for (const badge of earned) {
    await sql`INSERT INTO user_badges (user_id, badge_id) VALUES (${userId}, ${badge.id})`;
  }

  return earned;
}
