import bcrypt from 'bcryptjs';
import { sql } from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const { full_name, bio, avatar, current_password, new_password, name_rainbow, dark_bubble, avatar_glow } = req.body || {};

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

  try {
    if (!isTeacher && avatar_glow) await requireBadge(12, 'El aro del avatar');
    if (!isTeacher && dark_bubble) await requireBadge(13, 'La burbuja oscura');
    if (!isTeacher && name_rainbow) await requireBadge(14, 'El nombre arcoíris');
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

  const [updated] = await sql`
    UPDATE users SET
      full_name = COALESCE(${full_name}, full_name),
      bio = COALESCE(${bio}, bio),
      avatar = COALESCE(${avatar}, avatar),
      name_rainbow = COALESCE(${name_rainbow}, name_rainbow),
      dark_bubble = COALESCE(${dark_bubble}, dark_bubble),
      avatar_glow = COALESCE(${avatar_glow}, avatar_glow)
    WHERE id = ${user.id}
    RETURNING id, email, full_name, role, avatar, bio, xp, level, name_rainbow, dark_bubble, avatar_glow
  `;
  res.status(200).json({ user: updated });
}
