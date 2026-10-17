// Desbloqueo secuencial de misiones, verificado en el servidor. Antes solo lo hacía la interfaz
// (Missions.jsx), así que un estudiante podía abrir cualquier misión por URL o llamar la API
// desde la consola y acreditar ejercicios de misiones bloqueadas (probado el 2026-10-17 con una
// cuenta de prueba: la Misión 5 quedó al 50 % sin haber hecho la 1).
import { sql } from './_db.js';
import { isStaffRole } from './_auth.js';

// Una misión está desbloqueada si: es la primera, la anterior está completada, o el estudiante
// ya tiene avance en ella (para no dejar bloqueado a nadie que ya venía jugándola antes de
// este control — p. ej. quien quedó con una misión anterior "congelada" por un error ya corregido).
export async function isMissionUnlocked(user, missionId) {
  if (isStaffRole(user.role)) return true;
  const [mission] = await sql`SELECT "order", module FROM missions WHERE id = ${missionId}`;
  if (!mission) return false;
  if (mission.order <= 1) return true;
  const [row] = await sql`
    SELECT
      EXISTS (
        SELECT 1 FROM user_progress p JOIN missions m ON m.id = p.mission_id
        WHERE p.user_id = ${user.id} AND m.module = ${mission.module}
          AND m."order" = ${mission.order - 1} AND p.status = 'completed'
      ) AS previous_done,
      EXISTS (
        SELECT 1 FROM user_progress p
        WHERE p.user_id = ${user.id} AND p.mission_id = ${missionId} AND p.progress_percentage > 0
      ) AS already_started
  `;
  return row.previous_done || row.already_started;
}
