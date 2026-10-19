// Límite simple de intentos fallidos, respaldado por la tabla system_logs (que ya existía en
// el esquema pero no la usaba nadie) — no hay Redis/KV disponible en el plan actual de Vercel,
// así que en vez de una solución en memoria (que no sobrevive entre invocaciones serverless
// distintas) se cuenta contra la base, que sí es compartida entre todas las instancias.
//
// Pensado para un curso pequeño (grupo cerrado de estudiantes), no para tráfico masivo:
// system_logs no se auto-limpia, pero las filas son livianas (unas pocas por intento fallido,
// nunca por uno exitoso) y esto es proporcional al riesgo real hasta que se justifique algo
// más robusto. Hallazgo de la auditoría de calidad, 2026-09-21: ni /login ni el código de
// registro de 4 dígitos tenían ningún límite de intentos.

export async function countRecentByEmail(sql, actionType, email, windowMinutes) {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM system_logs
    WHERE action_type = ${actionType} AND user_email = ${email}
      AND created_at > now() - (${windowMinutes}::text || ' minutes')::interval
      AND created_at > COALESCE((
        SELECT MAX(created_at) FROM system_logs WHERE action_type = 'login_unlocked' AND user_email = ${email}
      ), '-infinity')
  `;
  return count;
}

// Levanta el bloqueo por intentos fallidos de un correo: los fallos anteriores a esta marca dejan
// de contar. Se usa al entrar bien, al cambiar la contraseña con un código, y cuando el docente
// genera un código o pulsa "Desbloquear" (antes el estudiante quedaba bloqueado 10 minutos aunque
// ya tuviera su contraseña nueva — reportado el 2026-10-19).
export async function unlockEmail(sql, email, description) {
  await sql`
    INSERT INTO system_logs (action_type, user_email, description, severity)
    VALUES ('login_unlocked', ${email}, ${description || null}, 'info')
  `;
}

export async function countRecentByIp(sql, actionType, ip, windowMinutes) {
  if (!ip) return 0; // sin IP conocida no se puede limitar por IP; que la limite por email decida
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM system_logs
    WHERE action_type = ${actionType} AND ip_address = ${ip}
      AND created_at > now() - (${windowMinutes}::text || ' minutes')::interval
  `;
  return count;
}

export async function logFailedAttempt(sql, actionType, { userEmail, ipAddress, description } = {}) {
  await sql`
    INSERT INTO system_logs (action_type, user_email, ip_address, description, severity)
    VALUES (${actionType}, ${userEmail || null}, ${ipAddress || null}, ${description || null}, 'warning')
  `;
}

// Vercel corre detrás de un proxy: la IP real del cliente viaja en x-forwarded-for, no en
// req.socket (que sería la del proxy). Puede traer varias IPs separadas por coma si hay
// varios proxies encadenados; la primera es la del cliente original.
export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}
