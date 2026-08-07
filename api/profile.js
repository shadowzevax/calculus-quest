import bcrypt from 'bcryptjs';
import { sql } from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const { full_name, bio, avatar, current_password, new_password, equipped_badge_id, name_rainbow } = req.body || {};

  // La insignia equipada (solo el ícono, sin cambio de color) y el nombre arcoíris son las
  // únicas recompensas cosméticas: solo se pueden usar insignias/logros que el estudiante ya
  // ganó (ver api/_badges.js). El docente no "juega" la plataforma, así que puede usar cualquiera.
  const isTeacher = user.role === 'admin';
  if (!isTeacher && equipped_badge_id !== undefined && equipped_badge_id !== null) {
    const [owned] = await sql`
      SELECT 1 FROM user_badges ub
      WHERE ub.user_id = ${user.id} AND ub.badge_id = ${equipped_badge_id}
    `;
    if (!owned) return res.status(403).json({ error: 'Esa insignia no ha sido desbloqueada' });
  }
  // El nombre arcoiris es la recompensa maxima: solo se activa tras completar las 14 misiones.
  if (!isTeacher && name_rainbow) {
    const [owned] = await sql`
      SELECT 1 FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = ${user.id} AND b.requirement_type = 'missions_completed' AND b.requirement_value = 14
    `;
    if (!owned) return res.status(403).json({ error: 'El nombre arcoíris aún no ha sido desbloqueado' });
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
      equipped_badge_id = COALESCE(${equipped_badge_id}, equipped_badge_id),
      name_rainbow = COALESCE(${name_rainbow}, name_rainbow)
    WHERE id = ${user.id}
    RETURNING id, email, full_name, role, avatar, bio, xp, level, equipped_badge_id, name_rainbow
  `;
  res.status(200).json({ user: updated });
}
