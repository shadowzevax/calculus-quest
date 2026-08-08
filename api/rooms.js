// Salas cooperativas de la mision "Escape Room" (por turnos, hasta N companeros,
// N = cantidad de acertijos de la mision). Reutilizables: no se gastan al jugarlas,
// y se autolimpian solas cuando quedan vacias o llevan mucho tiempo abandonadas.
import { sql } from './_db.js';
import { requireAuth } from './_auth.js';
import { checkAndAwardBadges } from './_badges.js';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusion
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function cleanupStaleRooms() {
  // Ninguna partida real dura mas de un par de horas; lo que sobra son salas
  // abandonadas (alguien cerro la pestaña sin salir). Se limpian solas de paso.
  await sql`DELETE FROM escape_rooms WHERE created_at < now() - interval '3 hours'`;
}

async function getPuzzles(missionId) {
  const [exercise] = await sql`
    SELECT * FROM exercises WHERE mission_id = ${missionId} AND is_active = true ORDER BY "order" ASC LIMIT 1
  `;
  const questions = exercise?.metadata?.questions || [];
  return { exercise, questions };
}

async function getRoomState(roomId, callerId) {
  const [room] = await sql`SELECT * FROM escape_rooms WHERE id = ${roomId}`;
  if (!room) return null;

  const members = await sql`
    SELECT erm.user_id, erm.join_order, u.full_name
    FROM escape_room_members erm
    JOIN users u ON u.id = erm.user_id
    WHERE erm.room_id = ${roomId}
    ORDER BY erm.join_order ASC
  `;

  const { questions } = await getPuzzles(room.mission_id);
  const totalPuzzles = questions.length;

  let turnUserId = null;
  let puzzle = null;
  if (room.status === 'playing' && members.length > 0 && room.current_puzzle_index < totalPuzzles) {
    const turnMember = members[room.current_puzzle_index % members.length];
    turnUserId = turnMember.user_id;
    const q = questions[room.current_puzzle_index];
    puzzle = { question: q.question, options: q.options };
  }

  return {
    id: room.id,
    code: room.code,
    status: room.status,
    host_user_id: room.host_user_id,
    current_puzzle_index: room.current_puzzle_index,
    total_puzzles: totalPuzzles,
    max_members: room.max_members,
    members: members.map((m) => ({ user_id: m.user_id, full_name: m.full_name, join_order: m.join_order })),
    turn_user_id: turnUserId,
    my_turn: turnUserId === callerId,
    puzzle,
  };
}

export default async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const roomId = req.query.room_id;
    if (!roomId) return res.status(400).json({ error: 'room_id requerido' });
    const isMember = await sql`SELECT 1 FROM escape_room_members WHERE room_id = ${roomId} AND user_id = ${user.id}`;
    if (isMember.length === 0) return res.status(403).json({ error: 'No perteneces a esta sala' });
    const state = await getRoomState(roomId, user.id);
    if (!state) return res.status(404).json({ error: 'Sala no encontrada' });
    return res.status(200).json(state);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action;

  if (action === 'create') {
    await cleanupStaleRooms();
    const { mission_id } = req.body || {};
    if (!mission_id) return res.status(400).json({ error: 'mission_id requerido' });

    const [mission] = await sql`SELECT * FROM missions WHERE id = ${mission_id}`;
    if (!mission || !mission.is_collaborative) return res.status(400).json({ error: 'Esta mision no es colaborativa' });

    const { questions } = await getPuzzles(mission_id);
    if (questions.length === 0) return res.status(400).json({ error: 'Esta mision no tiene acertijos configurados' });

    let code = generateCode();
    for (let i = 0; i < 5; i++) {
      const [clash] = await sql`SELECT 1 FROM escape_rooms WHERE code = ${code}`;
      if (!clash) break;
      code = generateCode();
    }

    const [room] = await sql`
      INSERT INTO escape_rooms (mission_id, code, host_user_id, max_members)
      VALUES (${mission_id}, ${code}, ${user.id}, ${questions.length})
      RETURNING id
    `;
    await sql`INSERT INTO escape_room_members (room_id, user_id, join_order) VALUES (${room.id}, ${user.id}, 1)`;

    return res.status(200).json(await getRoomState(room.id, user.id));
  }

  if (action === 'join') {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code requerido' });

    const [room] = await sql`SELECT * FROM escape_rooms WHERE code = ${code.toUpperCase()}`;
    if (!room) return res.status(404).json({ error: 'Sala no encontrada' });
    if (room.status !== 'lobby') return res.status(400).json({ error: 'Esa sala ya inició o terminó' });

    const already = await sql`SELECT 1 FROM escape_room_members WHERE room_id = ${room.id} AND user_id = ${user.id}`;
    if (already.length === 0) {
      const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM escape_room_members WHERE room_id = ${room.id}`;
      if (count >= room.max_members) return res.status(400).json({ error: 'La sala está llena' });
      const [{ max_order }] = await sql`SELECT COALESCE(MAX(join_order), 0)::int AS max_order FROM escape_room_members WHERE room_id = ${room.id}`;
      await sql`INSERT INTO escape_room_members (room_id, user_id, join_order) VALUES (${room.id}, ${user.id}, ${max_order + 1})`;
    }

    return res.status(200).json(await getRoomState(room.id, user.id));
  }

  // Las acciones restantes operan sobre una sala puntual.
  const { room_id } = req.body || {};
  if (!room_id) return res.status(400).json({ error: 'room_id requerido' });
  const [room] = await sql`SELECT * FROM escape_rooms WHERE id = ${room_id}`;
  if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

  if (action === 'start') {
    if (room.host_user_id !== user.id) return res.status(403).json({ error: 'Solo quien creó la sala puede iniciarla' });
    if (room.status !== 'lobby') return res.status(400).json({ error: 'La sala ya inició' });
    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM escape_room_members WHERE room_id = ${room_id}`;
    if (count < 2) return res.status(400).json({ error: 'Necesitas al menos otro compañero en la sala para empezar' });
    await sql`UPDATE escape_rooms SET status = 'playing', current_puzzle_index = 0 WHERE id = ${room_id}`;
    return res.status(200).json(await getRoomState(room_id, user.id));
  }

  if (action === 'cancel') {
    if (room.host_user_id !== user.id) return res.status(403).json({ error: 'Solo quien creó la sala puede cerrarla' });
    await sql`DELETE FROM escape_rooms WHERE id = ${room_id}`;
    return res.status(200).json({ ok: true });
  }

  if (action === 'leave') {
    await sql`DELETE FROM escape_room_members WHERE room_id = ${room_id} AND user_id = ${user.id}`;
    const remaining = await sql`SELECT user_id, join_order FROM escape_room_members WHERE room_id = ${room_id} ORDER BY join_order ASC`;
    if (remaining.length === 0) {
      await sql`DELETE FROM escape_rooms WHERE id = ${room_id}`;
      return res.status(200).json({ ok: true, room_closed: true });
    }
    if (room.host_user_id === user.id) {
      await sql`UPDATE escape_rooms SET host_user_id = ${remaining[0].user_id} WHERE id = ${room_id}`;
    }
    return res.status(200).json({ ok: true });
  }

  if (action === 'answer') {
    if (room.status !== 'playing') return res.status(400).json({ error: 'La sala no está en juego' });
    const { selected_index } = req.body || {};

    const members = await sql`SELECT user_id FROM escape_room_members WHERE room_id = ${room_id} ORDER BY join_order ASC`;
    if (members.length === 0) return res.status(400).json({ error: 'Sala vacía' });
    const turnUserId = members[room.current_puzzle_index % members.length].user_id;
    if (turnUserId !== user.id) return res.status(403).json({ error: 'No es tu turno' });

    const { exercise, questions } = await getPuzzles(room.mission_id);
    const puzzle = questions[room.current_puzzle_index];
    if (!puzzle) return res.status(400).json({ error: 'No hay acertijo activo' });

    const isCorrect = selected_index === puzzle.correct_index;
    if (!isCorrect) {
      return res.status(200).json({ ok: true, is_correct: false, explanation: puzzle.explanation });
    }

    const newIndex = room.current_puzzle_index + 1;

    if (newIndex >= questions.length) {
      // Se resolvieron los N acertijos: se marca la sala terminada y se premia a
      // TODOS los que estaban presentes en ese momento, igual que progress.js.
      await sql`UPDATE escape_rooms SET status = 'done', current_puzzle_index = ${newIndex} WHERE id = ${room_id}`;

      for (const m of members) {
        await sql`
          INSERT INTO exercise_attempts (user_id, exercise_id, answer_given, is_correct, xp_earned)
          VALUES (${m.user_id}, ${exercise.id}, ${'sala:' + room.code}, true, ${exercise.xp_value || 0})
        `;
        const priorCorrect = await sql`
          SELECT id FROM exercise_attempts WHERE user_id = ${m.user_id} AND exercise_id = ${exercise.id} AND is_correct = true
        `;
        if (priorCorrect.length <= 1 && exercise.xp_value) {
          await sql`UPDATE users SET xp = xp + ${exercise.xp_value} WHERE id = ${m.user_id}`;
        }
        await sql`
          INSERT INTO user_progress (user_id, mission_id, status, progress_percentage, exercises_completed, total_exercises, started_date, completed_date)
          VALUES (${m.user_id}, ${room.mission_id}, 'completed', 100, 1, 1, now(), now())
          ON CONFLICT (user_id, mission_id) DO UPDATE SET
            status = 'completed', progress_percentage = 100, exercises_completed = 1, total_exercises = 1,
            completed_date = now()
        `;
        await checkAndAwardBadges(m.user_id);
      }
    } else {
      await sql`UPDATE escape_rooms SET current_puzzle_index = ${newIndex} WHERE id = ${room_id}`;
    }

    return res.status(200).json({ ok: true, is_correct: true, explanation: puzzle.explanation, room: await getRoomState(room_id, user.id) });
  }

  return res.status(400).json({ error: 'Acción no reconocida' });
}
