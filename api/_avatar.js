// Desbloqueo de piezas del avatar armable (Avataaars). Se llama despues de completar una
// mision (progress.js y rooms.js) y despues de ganar un bono de velocidad (progress.js).
import { sql } from './_db.js';

export async function checkAndUnlockAvatarPieces(userId) {
  const alreadyUnlocked = await sql`SELECT piece_id FROM user_avatar_pieces WHERE user_id = ${userId}`;
  const unlockedIds = new Set(alreadyUnlocked.map((r) => r.piece_id));

  const [{ count: missionsCompleted }] = await sql`
    SELECT COUNT(*)::int AS count FROM user_progress WHERE user_id = ${userId} AND status = 'completed'
  `;
  const [{ speed_bonus_count }] = await sql`SELECT speed_bonus_count FROM users WHERE id = ${userId}`;

  const candidates = await sql`
    SELECT * FROM avatar_pieces
    WHERE (unlock_type = 'mission' AND unlock_mission_order <= ${missionsCompleted})
       OR (unlock_type = 'finale' AND unlock_mission_order <= ${missionsCompleted})
       OR (unlock_type = 'speed' AND speed_tier <= ${Math.floor(speed_bonus_count / 5)})
  `;

  const newlyUnlocked = candidates.filter((p) => !unlockedIds.has(p.id));
  for (const piece of newlyUnlocked) {
    await sql`INSERT INTO user_avatar_pieces (user_id, piece_id) VALUES (${userId}, ${piece.id}) ON CONFLICT DO NOTHING`;
  }
  return newlyUnlocked;
}

export async function incrementSpeedBonusCount(userId) {
  await sql`UPDATE users SET speed_bonus_count = speed_bonus_count + 1 WHERE id = ${userId}`;
}
