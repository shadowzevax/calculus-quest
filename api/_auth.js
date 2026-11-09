// Funciones de sesión (JWT + cookie) compartidas por los endpoints.
// Empieza con "_" para que Vercel NO lo trate como una ruta pública.
import jwt from 'jsonwebtoken';
import { sql } from './_db.js';

const COOKIE_NAME = 'cq_token';

// Cuentas de evaluación: las dos cuentas de prueba que se entregan a los jurados. Ven la
// plataforma completa con las cifras reales, pero los nombres y correos de los participantes
// les llegan enmascarados (Ley 1581 de 2012) y no pueden modificar las cuentas de los demás.
export const TEST_EMAILS = new Set(['estudiante@gmail.com', 'docente@gmail.com']);

export const EVALUATION_BLOCKED = 'Cuenta de evaluación: esta acción está deshabilitada sobre estudiantes reales para proteger a los participantes. Puede probarla sobre la cuenta Test Estudiante.';

export function isEvaluationAccount(user) {
  return TEST_EMAILS.has(String(user?.email || '').toLowerCase());
}

// "Carlos Mario Zafra" -> "C*** M***". Una sola letra por palabra y siempre tres asteriscos,
// para no revelar la longitud: con más letras, en un grupo de 20 se reconocería a varios.
export function maskName(fullName) {
  const words = String(fullName || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return words.map((w) => `${w[0].toUpperCase()}***`).join(' ') || 'Participante';
}

export function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  return domain ? `${local[0] || ''}***@${domain}` : '***';
}

// Copia de la fila con los datos personales enmascarados (la foto de perfil también se quita).
export function maskPerson(row) {
  const out = { ...row, full_name: maskName(row.full_name) };
  if ('email' in row) out.email = maskEmail(row.email);
  if ('avatar' in row) out.avatar = null;
  return out;
}

// Token con solo lo necesario para identificar al usuario (id, rol, email).
export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
}

// HttpOnly = JS del navegador no puede leerla (evita robo por XSS).
export function setAuthCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax; Secure`
  );
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`);
}

// Valida el JWT de la cookie. Devuelve null si no hay sesión o expiró.
export function getUserFromRequest(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const token = match ? match[1] : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  return user;
}

// 'admin' (docente) y 'superadmin' (administrador) tienen exactamente los mismos permisos de
// docente en toda la plataforma — la única diferencia es que solo superadmin puede cambiar
// roles (ver requireSuperAdmin más abajo). Se les llama "staff" en conjunto.
export function isStaffRole(role) {
  return role === 'admin' || role === 'superadmin';
}

// Igual que requireAuth pero exige rol docente o administrador (endpoints de staff).
// A diferencia de requireAuth, revalida el rol contra la base de datos en vez de confiar
// ciegamente en el que venía en el JWT (que puede durar hasta 30 días) — así, si un
// administrador le cambia el rol a alguien, el cambio aplica de inmediato en estos endpoints
// de baja frecuencia en vez de esperar a que expire la sesión vieja.
export async function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  const [row] = await sql`SELECT role FROM users WHERE id = ${user.id}`;
  if (!row || !isStaffRole(row.role)) {
    res.status(403).json({ error: 'Requiere rol docente' });
    return null;
  }
  return { ...user, role: row.role };
}

// Solo para el rol tope (administrador) — hoy en día, únicamente cambiar de rol a otro
// usuario. El propio rol 'superadmin' nunca se asigna desde la interfaz, solo a mano en la
// base de datos, así que no hay riesgo de que alguien se auto-ascienda por aquí.
// Igual que requireAdmin, revalida el rol real en la base de datos en vez de confiar en el JWT.
export async function requireSuperAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  const [row] = await sql`SELECT role FROM users WHERE id = ${user.id}`;
  if (!row || row.role !== 'superadmin') {
    res.status(403).json({ error: 'Requiere rol administrador' });
    return null;
  }
  return { ...user, role: row.role };
}
