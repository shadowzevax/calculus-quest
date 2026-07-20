// Funciones de sesión (JWT + cookie) compartidas por los endpoints.
// Empieza con "_" para que Vercel NO lo trate como una ruta pública.
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'cq_token';

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

// Igual que requireAuth pero exige rol admin (endpoints de docente).
export function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Requiere rol docente' });
    return null;
  }
  return user;
}
