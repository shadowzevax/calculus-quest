// Registro, login, logout y "me", juntos en un solo endpoint (?action=...)
// porque Vercel Hobby permite máx. 12 funciones serverless por proyecto.
import bcrypt from 'bcryptjs';
import { sql } from './_db.js';
import { signToken, setAuthCookie, clearAuthCookie, getUserFromRequest } from './_auth.js';
import { grantStarterColors } from './_avatar.js';
import { isCodeValid } from './_regcode.js';
import { countRecentByEmail, countRecentByIp, logFailedAttempt, getClientIp } from './_ratelimit.js';

// Cuentas de prueba que quedan exentas del dominio institucional y del código
// del docente, para poder seguir haciendo pruebas/demos sin depender de un correo real.
const TEST_EMAILS = new Set(['estudiante@gmail.com', 'docente@gmail.com']);
const INSTITUTIONAL_DOMAIN = '@umariana.edu.co';

export default async function handler(req, res) {
  const action = req.query.action;

  if (action === 'register' && req.method === 'POST') {
    const { email, password, full_name, avatar_gender, avatar_config, reg_code } = req.body || {};
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email y contraseña (mín. 6 caracteres) son requeridos' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const isTestEmail = TEST_EMAILS.has(normalizedEmail);
    if (!isTestEmail) {
      if (!normalizedEmail.endsWith(INSTITUTIONAL_DOMAIN)) {
        return res.status(400).json({ error: `Debes registrarte con tu correo institucional (${INSTITUTIONAL_DOMAIN})` });
      }
      // El código de 4 dígitos rota cada 10 min (9000 combinaciones) — sin este límite, un
      // script podía probarlas todas dentro de esa misma ventana. 20 intentos por IP cada 10
      // min deja pasar de sobra a un estudiante que se equivoca tecleando, pero reduce un
      // ataque de fuerza bruta a ~0.2% de probabilidad por rotación (hallazgo de la auditoría
      // de calidad, 2026-09-21).
      const ip = getClientIp(req);
      const recentFails = await countRecentByIp(sql, 'register_code_failed', ip, 10);
      if (recentFails >= 20) {
        return res.status(429).json({ error: 'Demasiados intentos con código incorrecto. Espera unos minutos e intenta de nuevo.' });
      }
      const valid = await isCodeValid(sql, reg_code);
      if (!valid) {
        await logFailedAttempt(sql, 'register_code_failed', { ipAddress: ip, userEmail: normalizedEmail });
        return res.status(400).json({ error: 'Código de registro inválido o vencido. Pídele el código actual a tu docente.' });
      }
    }
    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
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
      VALUES (${normalizedEmail}, ${password_hash}, ${full_name || normalizedEmail.split('@')[0]}, 'user', ${gender}, ${config ? JSON.stringify(config) : null}::jsonb)
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

    const normalizedEmail = email.trim().toLowerCase();

    // Sin límite, un script paciente podía probar contraseñas comunes contra una cuenta
    // puntual sin bloquearse (bcrypt lo hace lento, pero no lo impide) — hallazgo de la
    // auditoría de calidad, 2026-09-21. 10 intentos fallidos cada 10 min por cuenta deja pasar
    // de sobra a alguien que se equivoca tecleando su propia contraseña.
    const recentFails = await countRecentByEmail(sql, 'login_failed', normalizedEmail, 10);
    if (recentFails >= 10) {
      return res.status(429).json({ error: 'Demasiados intentos fallidos con esta cuenta. Espera unos minutos e intenta de nuevo.' });
    }

    const [user] = await sql`SELECT * FROM users WHERE email = ${normalizedEmail}`;
    if (!user) {
      await logFailedAttempt(sql, 'login_failed', { userEmail: normalizedEmail, ipAddress: getClientIp(req) });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await logFailedAttempt(sql, 'login_failed', { userEmail: normalizedEmail, ipAddress: getClientIp(req) });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await sql`UPDATE users SET last_login = now() WHERE id = ${user.id}`;
    const token = signToken(user);
    setAuthCookie(res, token);
    delete user.password_hash;
    return res.status(200).json({ user });
  }

  // Canjea el código temporal que le dio el docente por una contraseña nueva — no requiere
  // sesión iniciada (justamente porque la perdió), solo el correo + el código vigente.
  if (action === 'redeem_reset_code' && req.method === 'POST') {
    const { email, code, new_password } = req.body || {};
    // Cada error dice exactamente qué falló (antes todo era "Código inválido o vencido": un
    // estudiante con el código correcto no sabía que el problema era haber escrito su @gmail.com
    // en vez del correo institucional — reportado el 2026-10-17).
    if (!email || !email.trim()) return res.status(400).json({ error: 'Escribe el correo de tu cuenta.' });
    if (!code || !code.trim()) return res.status(400).json({ error: 'Escribe el código que te dio tu docente.' });
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'La contraseña nueva debe tener al menos 6 caracteres.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim().toUpperCase();
    if (!TEST_EMAILS.has(normalizedEmail) && !normalizedEmail.endsWith(INSTITUTIONAL_DOMAIN)) {
      return res.status(400).json({ error: `Usa tu correo institucional (${INSTITUTIONAL_DOMAIN}), el mismo con el que te registraste.` });
    }

    // Mismo límite que login/registro: el código es corto, y sin límite se podía probar fuerza
    // bruta contra una cuenta puntual (hallazgo de la auditoría de calidad, 2026-09-21).
    const recentFails = await countRecentByEmail(sql, 'reset_code_failed', normalizedEmail, 10);
    if (recentFails >= 10) {
      return res.status(429).json({ error: 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.' });
    }

    const [user] = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
    if (!user) {
      await logFailedAttempt(sql, 'reset_code_failed', { userEmail: normalizedEmail, ipAddress: getClientIp(req) });
      return res.status(400).json({ error: 'No existe ninguna cuenta con ese correo. Revisa que esté bien escrito.' });
    }

    const [resetRow] = await sql`
      SELECT id, used_at, expires_at <= now() AS expired FROM password_reset_codes
      WHERE user_id = ${user.id} AND code = ${normalizedCode}
      ORDER BY created_at DESC LIMIT 1
    `;
    if (!resetRow || resetRow.used_at || resetRow.expired) {
      await logFailedAttempt(sql, 'reset_code_failed', { userEmail: normalizedEmail, ipAddress: getClientIp(req) });
      const msg = !resetRow
        ? 'Ese código no corresponde a esta cuenta. Revisa que lo escribiste bien o pídele uno nuevo a tu docente.'
        : resetRow.used_at
          ? 'Ese código ya se usó o fue reemplazado por uno más nuevo. Cada código sirve una sola vez: pídele uno nuevo a tu docente.'
          : 'Ese código ya venció. Pídele uno nuevo a tu docente.';
      return res.status(400).json({ error: msg });
    }

    // Se marca como usado ANTES de cambiar la contraseña y solo si nadie lo usó entre medio,
    // para que el mismo código no sirva dos veces aunque se envíe dos veces al mismo tiempo.
    const [claimed] = await sql`UPDATE password_reset_codes SET used_at = now() WHERE id = ${resetRow.id} AND used_at IS NULL RETURNING id`;
    if (!claimed) return res.status(400).json({ error: 'Ese código ya se usó. Cada código sirve una sola vez: pídele uno nuevo a tu docente.' });
    const password_hash = await bcrypt.hash(new_password, 10);
    await sql`UPDATE users SET password_hash = ${password_hash} WHERE id = ${user.id}`;
    return res.status(200).json({ ok: true });
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
