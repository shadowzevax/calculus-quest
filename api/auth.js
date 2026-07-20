// ============================================================================
// Endpoint de autenticación: registro, login, logout y "quién soy" (me).
//
// Nota de arquitectura: normalmente estas serían 4 archivos separados
// (api/auth/register.js, login.js, etc.), pero Vercel (plan gratuito Hobby)
// solo permite 12 funciones serverless por proyecto. Como el resto del API
// ya usa varios archivos, aquí los 4 se juntaron en UNO y se elige la acción
// con el query param ?action=, ej: POST /api/auth?action=login
// ============================================================================
import bcrypt from 'bcryptjs';
import { sql } from './_db.js';
import { signToken, setAuthCookie, clearAuthCookie, getUserFromRequest } from './_auth.js';

export default async function handler(req, res) {
  const action = req.query.action;

  // --- Registro de un nuevo estudiante ---
  if (action === 'register' && req.method === 'POST') {
    const { email, password, full_name } = req.body || {};
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email y contraseña (mín. 6 caracteres) son requeridos' });
    }
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Ese correo ya está registrado' });

    // Nunca guardamos la contraseña tal cual: bcrypt genera un "hash"
    // (una especie de huella digital irreversible). Ni siquiera nosotros
    // como desarrolladores podemos ver la contraseña real de un usuario,
    // solo comparar si una contraseña dada produce el mismo hash.
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

  // --- Inicio de sesión ---
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

  // --- Cierre de sesión: solo borra la cookie del navegador ---
  if (action === 'logout' && req.method === 'POST') {
    clearAuthCookie(res);
    return res.status(200).json({ ok: true });
  }

  // --- "¿Quién soy?": se llama al cargar la app para saber si ya hay
  // una sesión activa (cookie válida) y mostrar el usuario logueado ---
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
