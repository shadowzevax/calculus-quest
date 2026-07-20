// Registro, login, logout y "me", juntos en un solo endpoint (?action=...)
// porque Vercel Hobby permite máx. 12 funciones serverless por proyecto.
import bcrypt from 'bcryptjs';
import { sql } from './_db.js';
import { signToken, setAuthCookie, clearAuthCookie, getUserFromRequest } from './_auth.js';

export default async function handler(req, res) {
  const action = req.query.action;

  if (action === 'register' && req.method === 'POST') {
    const { email, password, full_name } = req.body || {};
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email y contraseña (mín. 6 caracteres) son requeridos' });
    }
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Ese correo ya está registrado' });

    // bcrypt guarda un hash irreversible, nunca la contraseña real.
    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (${email}, ${password_hash}, ${full_name || email.split('@')[0]}, 'user')
      RETURNING id, email, full_name, role, xp, level, avatar
    `;
    const token = signToken(user);
    setAuthCookie(res, token);
    return res.status(201).json({ user });
  }

  if (action === 'login' && req.method === 'POST') {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    await sql`UPDATE users SET last_login = now() WHERE id = ${user.id}`;
    const token = signToken(user);
    setAuthCookie(res, token);
    delete user.password_hash;
    return res.status(200).json({ user });
  }

  if (action === 'logout' && req.method === 'POST') {
    clearAuthCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (action === 'me' && req.method === 'GET') {
    const authUser = getUserFromRequest(req);
    if (!authUser) return res.status(401).json({ error: 'No autenticado' });
    const [user] = await sql`
      SELECT id, email, full_name, role, avatar, bio, xp, level, streak_days
      FROM users WHERE id = ${authUser.id}
    `;
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    return res.status(200).json({ user });
  }

  res.status(404).json({ error: 'Acción no encontrada' });
}
