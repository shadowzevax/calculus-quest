// Registro, login, logout y "me", juntos en un solo endpoint (?action=...)
// porque Vercel Hobby permite máx. 12 funciones serverless por proyecto.
import bcrypt from 'bcryptjs';
import { sql } from './_db.js';
import { signToken, setAuthCookie, clearAuthCookie, getUserFromRequest } from './_auth.js';
import { grantStarterColors } from './_avatar.js';

export default async function handler(req, res) {
  const action = req.query.action;

  if (action === 'register' && req.method === 'POST') {
    const { email, password, full_name, avatar_gender, avatar_config } = req.body || {};
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email y contraseña (mín. 6 caracteres) son requeridos' });
    }
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Ese correo ya está registrado' });

    // El avatar inicial se elige entre las piezas "starter" del genero elegido — se revalida
    // en el servidor (no se confia en lo que mande el cliente) para que nadie pueda registrarse
    // ya con una pieza rara sin haberla ganado.
    let gender = null;
    let config = null;
    if (avatar_gender === 'male' || avatar_gender === 'female') {
      const starterTop = await sql`SELECT value FROM avatar_pieces WHERE unlock_type = 'starter' AND category = 'top' AND gender = ${avatar_gender}`;
      const starterClothing = await sql`SELECT value FROM avatar_pieces WHERE unlock_type = 'starter' AND category = 'clothing'`;
      const validTop = new Set(starterTop.map((r) => r.value));
      const validClothing = new Set(starterClothing.map((r) => r.value));
      const [skinRows, hairRows, clothesRows] = await Promise.all([
        sql`SELECT value FROM avatar_pieces WHERE category = 'skinColor'`,
        sql`SELECT value FROM avatar_pieces WHERE category = 'hairColor'`,
        sql`SELECT value FROM avatar_pieces WHERE category = 'clothesColor'`,
      ]);
      const validSkin = new Set(skinRows.map((r) => r.value));
      const validHair = new Set(hairRows.map((r) => r.value));
      const validClothes = new Set(clothesRows.map((r) => r.value));
      if (avatar_config && validTop.has(avatar_config.top) && validClothing.has(avatar_config.clothing)) {
        gender = avatar_gender;
        config = {
          top: avatar_config.top,
          clothing: avatar_config.clothing,
          skinColor: validSkin.has(avatar_config.skinColor) ? avatar_config.skinColor : 'edb98a',
          hairColor: validHair.has(avatar_config.hairColor) ? avatar_config.hairColor : '2c1b18',
          clothesColor: validClothes.has(avatar_config.clothesColor) ? avatar_config.clothesColor : (avatar_gender === 'male' ? '5199e4' : 'ff488e'),
          eyes: 'default', eyebrows: 'default', mouth: 'smile',
        };
      }
    }

    // bcrypt guarda un hash irreversible, nunca la contraseña real.
    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (email, password_hash, full_name, role, avatar_gender, avatar_config)
      VALUES (${email}, ${password_hash}, ${full_name || email.split('@')[0]}, 'user', ${gender}, ${config ? JSON.stringify(config) : null}::jsonb)
      RETURNING id, email, full_name, role, xp, level, avatar, avatar_config, avatar_gender
    `;
    if (config) {
      await grantStarterColors(user.id, config);
    }
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
      SELECT id, email, full_name, role, avatar, bio, xp, level, streak_days, name_rainbow, dark_bubble, avatar_glow, avatar_config, avatar_gender
      FROM users WHERE id = ${authUser.id}
    `;
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    return res.status(200).json({ user });
  }

  res.status(404).json({ error: 'Acción no encontrada' });
}
