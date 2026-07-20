// ============================================================================
// Funciones de autenticación reutilizables por todos los endpoints (api/*.js).
//
// Cómo funciona la sesión de usuario en este proyecto:
// 1. Al hacer login/registro, generamos un JWT (JSON Web Token) firmado con
//    nuestra clave secreta (JWT_SECRET, variable de entorno en Vercel).
// 2. Ese token se guarda en una cookie HttpOnly (el navegador la envía sola
//    en cada petición, y JavaScript del navegador NO puede leerla, lo que
//    evita robo de sesión por XSS).
// 3. En cada endpoint protegido, leemos la cookie, verificamos la firma del
//    token y así sabemos quién es el usuario sin necesitar una tabla de
//    "sesiones activas" en la base de datos (por eso se llama "stateless auth").
//
// IMPORTANTE: el archivo empieza con "_" (guion bajo) a propósito. Vercel
// convierte automáticamente cada archivo dentro de api/ en un endpoint HTTP,
// EXCEPTO los que empiezan con "_". Como este archivo es solo un módulo de
// funciones auxiliares (no debe responder a peticiones HTTP), el "_" evita
// que Vercel intente publicarlo como una ruta más.
// ============================================================================
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'cq_token';

// Genera el token con los datos mínimos necesarios (id, rol, email).
// No metemos la contraseña ni datos sensibles aquí porque el token
// viaja en cada petición y cualquiera con la cookie podría decodificarlo
// (no leerlo sin la clave, pero sí ver la estructura).
export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
}

// Guarda el token en una cookie. Flags importantes:
// - HttpOnly: JavaScript del navegador no puede leerla (protege contra XSS).
// - Secure: solo se envía por HTTPS.
// - SameSite=Lax: mitiga ataques CSRF básicos.
export function setAuthCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax; Secure`
  );
}

// Al cerrar sesión, sobrescribimos la cookie con Max-Age=0 para que el
// navegador la borre inmediatamente.
export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`);
}

// Lee la cookie de la petición y valida el JWT. Si no hay cookie o el
// token es inválido/expiró, retorna null (no lanza error, para que cada
// endpoint decida qué hacer: por ejemplo /api/missions es público y no
// llama a esta función, mientras que /api/progress sí la necesita).
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

// Helper para endpoints que requieren estar logueado (cualquier rol).
// Si no hay usuario válido, ya responde 401 y retorna null; el endpoint
// que llama a esto solo necesita hacer "if (!user) return;".
export function requireAuth(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  return user;
}

// Igual que requireAuth, pero además exige que el rol sea 'admin'.
// Se usa en todos los endpoints exclusivos del docente (gestión de
// usuarios, misiones, estadísticas, reparar misiones, etc.).
export function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Requiere rol docente' });
    return null;
  }
  return user;
}
