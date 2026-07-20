import bcrypt from 'bcryptjs';
import { sql } from '../_db.js';
import { signToken, setAuthCookie } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
  res.status(200).json({ user });
}
