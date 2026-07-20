import bcrypt from 'bcryptjs';
import { sql } from '../_db.js';
import { signToken, setAuthCookie } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, full_name } = req.body || {};
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email y contraseña (mín. 6 caracteres) son requeridos' });
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Ese correo ya está registrado' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [user] = await sql`
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES (${email}, ${password_hash}, ${full_name || email.split('@')[0]}, 'user')
    RETURNING id, email, full_name, role, xp, level, avatar
  `;

  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(201).json({ user });
}
