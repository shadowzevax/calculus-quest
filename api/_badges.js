// Revisa si el usuario cumple los requisitos de alguna insignia (badge) que
// todavía no tiene, y si es así la otorga. Se llama después de completar
// una misión, desde progress.js.
import { sql } from './_db.js';

export async function checkAndAwardBadges(userId, { justCompletedMissionId } = {}) {
  const [user] = await sql`SELECT xp FROM users WHERE id = ${userId}`;
  if (!user) return [];

  const pending = await sql`
    SELECT b.* FROM badges b
    WHERE b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ${userId})
  `;
  if (pending.length === 0) return [];

  const [{ count: missionsCompleted }] = await sql`
    SELECT COUNT(*)::int AS count FROM user_progress
    WHERE user_id = ${userId} AND status = 'completed'
  `;

  let missionWasPerfect = false;
  if (justCompletedMissionId) {
    const attempts = await sql`
      SELECT is_correct FROM exercise_attempts
      WHERE user_id = ${userId}
        AND exercise_id IN (SELECT id FROM exercises WHERE mission_id = ${justCompletedMissionId})
    `;
    missionWasPerfect = attempts.length > 0 && attempts.every((a) => a.is_correct);
  }

  const earned = [];
  for (const badge of pending) {
    let meets = false;
    if (badge.requirement_type === 'missions_completed') {
      meets = missionsCompleted >= badge.requirement_value;
    } else if (badge.requirement_type === 'xp_reached') {
      meets = user.xp >= badge.requirement_value;
    } else if (badge.requirement_type === 'perfect_mission') {
      meets = missionWasPerfect;
    }
    if (meets) earned.push(badge);
  }

  for (const badge of earned) {
    await sql`INSERT INTO user_badges (user_id, badge_id) VALUES (${userId}, ${badge.id})`;
  }

  return earned;
}
