// Desbloqueo de piezas del avatar armable (Avataaars). Se llama despues de completar una
// mision (progress.js y rooms.js) y despues de ganar un bono de velocidad (progress.js).
import { sql } from './_db.js';

// Cuantos bonos de velocidad hay que acumular para desbloquear la siguiente pieza de avatar
// (objeto avatar = cualquier cosa de la librería: peinado, gorro, ropa, accesorio, color, etc).
export const SPEED_BONUS_GROUP = 3;

export async function checkAndUnlockAvatarPieces(userId) {
  const alreadyUnlocked = await sql`SELECT piece_id FROM user_avatar_pieces WHERE user_id = ${userId}`;
  const unlockedIds = new Set(alreadyUnlocked.map((r) => r.piece_id));

  const [{ count: missionsCompleted }] = await sql`
    SELECT COUNT(*)::int AS count FROM user_progress WHERE user_id = ${userId} AND status = 'completed'
  `;
  const [{ speed_bonus_count, avatar_gender }] = await sql`SELECT speed_bonus_count, avatar_gender FROM users WHERE id = ${userId}`;
  // Sin genero elegido todavia (cuenta vieja de antes de este sistema) no se desbloquea nada
  // especifico de genero — solo lo unisex, hasta que elija en Mi Perfil.
  const gender = avatar_gender || 'unisex';

  // Cada SPEED_BONUS_GROUP bonos de velocidad acumulados desbloquea la siguiente pieza (o
  // varias, si comparten tier) — igual que las misiones, es un premio por acumular progreso,
  // no algo que se gane en un solo intento.
  const candidates = await sql`
    SELECT * FROM avatar_pieces
    WHERE (gender = 'unisex' OR gender = ${gender})
      AND (
        (unlock_type = 'mission' AND unlock_mission_order <= ${missionsCompleted})
        OR (unlock_type = 'finale' AND unlock_mission_order <= ${missionsCompleted})
        OR (unlock_type = 'speed' AND speed_tier <= ${Math.floor(speed_bonus_count / SPEED_BONUS_GROUP)})
      )
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

// Desbloquea unicamente el color (piel/pelo/ropa) que ya trae el avatar elegido por el
// usuario al registrarse o al elegir genero por primera vez. Los demas colores quedan
// bloqueados como cualquier otra pieza, para ganarse por mision/cronometro.
export async function grantStarterColors(userId, { skinColor, hairColor, clothesColor }) {
  const values = [skinColor, hairColor, clothesColor].filter(Boolean);
  if (values.length === 0) return;
  const pieces = await sql`
    SELECT id FROM avatar_pieces
    WHERE (category = 'skinColor' AND value = ${skinColor})
       OR (category = 'hairColor' AND value = ${hairColor})
       OR (category = 'clothesColor' AND value = ${clothesColor})
  `;
  for (const piece of pieces) {
    await sql`INSERT INTO user_avatar_pieces (user_id, piece_id) VALUES (${userId}, ${piece.id}) ON CONFLICT DO NOTHING`;
  }
}
