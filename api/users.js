import { sql } from './_db.js';
import { requireAdmin, requireSuperAdmin } from './_auth.js';

// Sin caracteres ambiguos (0/O, 1/I/L) para que un estudiante lo pueda copiar bien a mano
// desde el tablero o desde un papel.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 30;

function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT id, email, full_name, role, xp, level, avatar, created_at
      FROM users ORDER BY created_at DESC
    `;
    return res.status(200).json(rows);
  }

  // Cambiar de rol es exclusivo del administrador (superadmin) — un docente no puede
  // ascenderse a sí mismo ni a otro. El rol 'superadmin' nunca se asigna desde aquí.
  if (req.method === 'PATCH') {
    if (!(await requireSuperAdmin(req, res))) return;
    const { id, role } = req.body || {};
    if (!id || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'id y role (user|admin) requeridos' });
    }
    const [target] = await sql`SELECT role FROM users WHERE id = ${id}`;
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (target.role === 'superadmin') {
      return res.status(403).json({ error: 'No se puede cambiar el rol del administrador' });
    }
    const [updated] = await sql`UPDATE users SET role = ${role} WHERE id = ${id} RETURNING id, email, role`;
    return res.status(200).json({ user: updated });
  }

  // Eliminar una cuenta — un docente solo puede eliminar estudiantes; el administrador puede
  // eliminar estudiantes Y docentes, pero nunca al administrador (ni a sí mismo) por aquí.
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id requerido' });
    const [target] = await sql`SELECT role FROM users WHERE id = ${id}`;
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (target.role === 'superadmin') {
      return res.status(403).json({ error: 'No se puede eliminar la cuenta del administrador' });
    }
    if (target.role === 'admin' && admin.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el administrador puede eliminar cuentas de docente' });
    }
    await sql`DELETE FROM users WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  // Genera un código temporal de acceso: el docente se lo da al estudiante (verbalmente, por
  // chat, etc.) y el estudiante lo canjea el mismo en la pantalla de login por una contraseña
  // nueva — así el docente nunca llega a conocer la contraseña del estudiante.
  if (req.method === 'POST' && req.query.action === 'reset_code') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id requerido' });
    const [user] = await sql`SELECT id, email, full_name, role FROM users WHERE id = ${id}`;
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Un docente solo puede generar códigos para estudiantes; solo el administrador puede
    // generarle uno a otro docente. El propio administrador nunca recibe código por aquí
    // (si el administrador pierde su acceso, se resuelve directo en la base de datos).
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'No se puede generar un código para el administrador' });
    }
    if (user.role === 'admin' && admin.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el administrador puede generar un código para un docente' });
    }

    // Invalida codigos anteriores sin usar de este usuario, para que solo el mas reciente sirva.
    await sql`UPDATE password_reset_codes SET used_at = now() WHERE user_id = ${id} AND used_at IS NULL`;
    const code = generateCode();
    const [row] = await sql`
      INSERT INTO password_reset_codes (user_id, code, expires_at)
      VALUES (${id}, ${code}, now() + ${CODE_TTL_MINUTES} * interval '1 minute')
      RETURNING code, expires_at
    `;
    return res.status(200).json({ code: row.code, expires_at: row.expires_at, email: user.email, full_name: user.full_name });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
