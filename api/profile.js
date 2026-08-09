import bcrypt from 'bcryptjs';
import { sql } from './_db.js';
import { requireAuth } from './_auth.js';
import { grantStarterColors } from './_avatar.js';

const MAX_AVATAR_LENGTH = 400_000; // ~300KB de imagen en base64, ya redimensionada en el navegador

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    // Catalogo del avatar armable: solo las piezas unisex + las del genero elegido por el
    // usuario, marcando cuales ya desbloqueo (las "starter" siempre cuentan como desbloqueadas).
    const isTeacher = user.role === 'admin';
    const [{ avatar_config, speed_bonus_count, avatar_gender }] = await sql`SELECT avatar_config, speed_bonus_count, avatar_gender FROM users WHERE id = ${user.id}`;
    const gender = avatar_gender || 'unisex';
    // El orden debe reflejar que tan pronto se consigue cada pieza en la practica: starter
    // (ya la tiene) primero, luego las de mision en orden de mision, luego las de bono de
    // velocidad en orden de tier, y las de la mision cooperativa (finale) al final. Antes se
    // ordenaba solo por unlock_mission_order con NULLS FIRST, lo que hacia que las piezas de
    // velocidad (sin numero de mision) aparecieran justo despues de las starter — antes que
    // piezas de mision 1, 3, etc. — aunque tardan mucho mas en conseguirse en la practica.
    const pieces = await sql`
      SELECT ap.*, uap.unlocked_at
      FROM avatar_pieces ap
      LEFT JOIN user_avatar_pieces uap ON uap.piece_id = ap.id AND uap.user_id = ${user.id}
      WHERE ap.gender = 'unisex' OR ap.gender = ${gender}
      ORDER BY ap.category,
        CASE ap.unlock_type
          WHEN 'starter' THEN 0
          WHEN 'mission' THEN 1
          WHEN 'speed' THEN 2
          WHEN 'finale' THEN 3
          ELSE 4
        END,
        ap.unlock_mission_order NULLS LAST,
        ap.speed_tier NULLS LAST
    `;
    return res.status(200).json({
      // "unlocked" decide si se puede EQUIPAR la pieza (el docente puede equipar cualquier
      // cosa para probar el catálogo) — "owned" es si realmente la ganó, sin el atajo de
      // docente, para no confundir "puede probársela" con "ya se la ganó como recompensa".
      pieces: pieces.map((p) => {
        const owned = p.unlock_type === 'starter' || !!p.unlocked_at
        return { ...p, unlocked: isTeacher || owned, owned }
      }),
      config: avatar_config,
      speed_bonus_count,
      avatar_gender,
    });
  }

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const { full_name, bio, avatar, current_password, new_password, name_rainbow, dark_bubble, avatar_glow, avatar_config, avatar_gender } = req.body || {};
  if (avatar_gender && !['male', 'female'].includes(avatar_gender)) {
    return res.status(400).json({ error: 'Género de avatar inválido' });
  }

  // El nombre arcoiris, la burbuja oscura y el aro del avatar son recompensas cosmeticas por
  // progreso: solo se activan tras alcanzar la insignia correspondiente.
  // (Equipar/desequipar insignias vive en api/badges.js, ahora que se pueden llevar varias a la vez.)
  const isTeacher = user.role === 'admin';
  const requireBadge = async (value, label) => {
    const [owned] = await sql`
      SELECT 1 FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = ${user.id} AND b.requirement_type = 'missions_completed' AND b.requirement_value = ${value}
    `;
    if (!owned) throw new Error(`${label} aún no ha sido desbloqueado`);
  };
  // La foto de perfil personalizada no está atada a una insignia (no todas las recompensas
  // tienen un ícono coleccionable), así que se verifica directo contra el progreso: haber
  // completado la misión con orden 11.
  const requireMissionOrder = async (order, label) => {
    const [done] = await sql`
      SELECT 1 FROM user_progress up JOIN missions m ON m.id = up.mission_id
      WHERE up.user_id = ${user.id} AND m."order" = ${order} AND up.progress_percentage >= 100
    `;
    if (!done) throw new Error(`${label} aún no ha sido desbloqueada`);
  };

  const removingAvatar = avatar === ''; // cadena vacía = "quitar foto", null/undefined = "sin cambios"

  // Mientras el usuario no tenga ningún color desbloqueado todavía (cuenta nueva, o cuenta
  // vieja de antes de que los colores se gatearan), el color con el que se guarda su avatar
  // por defecto se desbloquea para él — los demás colores quedan bloqueados como cualquier
  // otra pieza. No se limita a "la primera vez que elige género" para que las cuentas viejas
  // también se autocorrijan la próxima vez que guarden su avatar.
  if (!isTeacher && avatar_config) {
    const [{ count: ownedColors }] = await sql`
      SELECT COUNT(*)::int AS count FROM user_avatar_pieces uap
      JOIN avatar_pieces ap ON ap.id = uap.piece_id
      WHERE uap.user_id = ${user.id} AND ap.category IN ('skinColor', 'hairColor', 'clothesColor')
    `;
    if (ownedColors === 0) await grantStarterColors(user.id, avatar_config);
  }

  try {
    if (!isTeacher && avatar && !removingAvatar) {
      await requireMissionOrder(11, 'La foto de perfil personalizada');
      if (avatar.length > MAX_AVATAR_LENGTH) throw new Error('La imagen es demasiado grande');
    }
    if (!isTeacher && avatar_glow) await requireBadge(12, 'El aro del avatar');
    if (!isTeacher && dark_bubble) await requireBadge(13, 'La burbuja oscura');
    if (!isTeacher && name_rainbow) await requireBadge(14, 'El nombre arcoíris');

    // Cada pieza que se quiera equipar, incluidos ojos/cejas/boca/colores, debe estar
    // realmente desbloqueada — se revalida en el servidor para que no baste con mandar
    // el PATCH a mano y "equipar" algo que todavía no se ganó.
    if (!isTeacher && avatar_config) {
      const pieceKeys = ['top', 'accessories', 'facialHair', 'clothing', 'clothingGraphic', 'eyes', 'eyebrows', 'mouth', 'skinColor', 'hairColor', 'clothesColor'];
      for (const key of pieceKeys) {
        const value = avatar_config[key];
        if (!value) continue;
        const [piece] = await sql`SELECT id, unlock_type FROM avatar_pieces WHERE category = ${key} AND value = ${value}`;
        if (!piece) throw new Error('Pieza de avatar inválida');
        if (piece.unlock_type === 'starter') continue;
        const [owned] = await sql`SELECT 1 FROM user_avatar_pieces WHERE user_id = ${user.id} AND piece_id = ${piece.id}`;
        if (!owned) throw new Error('Esa pieza de avatar aún no ha sido desbloqueada');
      }
    }
  } catch (e) {
    return res.status(403).json({ error: e.message });
  }

  // Cambio de contraseña: se pide la actual para confirmar que es el
  // dueño de la cuenta (no solo alguien con la sesión abierta en el navegador).
  if (new_password) {
    if (!current_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Contraseña actual y nueva (mín. 6 caracteres) requeridas' });
    }
    const [row] = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
    const valid = await bcrypt.compare(current_password, row.password_hash);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const password_hash = await bcrypt.hash(new_password, 10);
    await sql`UPDATE users SET password_hash = ${password_hash} WHERE id = ${user.id}`;
  }

  // Al reemplazar (o quitar) la foto, el UPDATE sobrescribe directamente el valor anterior en
  // la misma columna — no queda ningún archivo viejo guardado en ningún lado que haya que
  // borrar aparte.
  const [updated] = await sql`
    UPDATE users SET
      full_name = COALESCE(${full_name}, full_name),
      bio = COALESCE(${bio}, bio),
      avatar = CASE WHEN ${removingAvatar} THEN NULL ELSE COALESCE(${avatar}, avatar) END,
      name_rainbow = COALESCE(${name_rainbow}, name_rainbow),
      dark_bubble = COALESCE(${dark_bubble}, dark_bubble),
      avatar_glow = COALESCE(${avatar_glow}, avatar_glow),
      avatar_config = COALESCE(${avatar_config ? JSON.stringify(avatar_config) : null}::jsonb, avatar_config),
      avatar_gender = COALESCE(${avatar_gender || null}, avatar_gender)
    WHERE id = ${user.id}
    RETURNING id, email, full_name, role, avatar, bio, xp, level, name_rainbow, dark_bubble, avatar_glow, avatar_config, avatar_gender
  `;
  res.status(200).json({ user: updated });
}
