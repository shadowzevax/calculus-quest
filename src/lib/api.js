// Único punto del frontend que habla con el backend (api/*.js).
// Las páginas usan api.algo.metodo(...) en vez de fetch directo.
const BASE = '/api';

// Cache simple en memoria (se pierde al recargar), evita refetch de datos
// que casi no cambian dentro de los 30s.
const cache = new Map();
const CACHE_TTL_MS = 30_000;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

async function cachedGet(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.time < CACHE_TTL_MS) return hit.data;
  const data = await request(path);
  cache.set(path, { data, time: Date.now() });
  return data;
}

// Limpia el cache tras un cambio (ej: al enviar un ejercicio se invalida
// '/ranking' porque el puntaje pudo cambiar).
function invalidate(prefix) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}

export const api = {
  missions: {
    list: (module = 'misiones') => cachedGet(`/missions?module=${module}`),
    update: (data) =>
      request('/missions', { method: 'PATCH', body: JSON.stringify(data) }).then((r) => {
        invalidate('/missions');
        return r;
      }),
  },
  exercises: {
    byMission: (missionId) => cachedGet(`/exercises?mission_id=${missionId}`),
  },
  progress: {
    list: () => request('/progress'),
    submit: (data) =>
      request('/progress', { method: 'POST', body: JSON.stringify(data) }).then((r) => {
        invalidate('/ranking');
        invalidate('/stats');
        invalidate('/badges');
        return r;
      }),
  },
  auth: {
    login: (email, password) =>
      request('/auth?action=login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data) => request('/auth?action=register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request('/auth?action=logout', { method: 'POST' }),
    me: () => request('/auth?action=me'),
  },
  stats: {
    get: () => cachedGet('/stats'),
  },
  ranking: {
    list: () => cachedGet('/ranking'),
  },
  profile: {
    update: (data) =>
      request('/profile', { method: 'PATCH', body: JSON.stringify(data) }).then((r) => {
        invalidate('/ranking');
        return r;
      }),
  },
  badges: {
    list: () => cachedGet('/badges'),
    toggle: (badgeId) =>
      request('/badges', { method: 'POST', body: JSON.stringify({ badge_id: badgeId }) }).then((r) => {
        invalidate('/badges');
        invalidate('/ranking');
        return r;
      }),
  },
  users: {
    list: () => cachedGet('/users'),
    setRole: (id, role) =>
      request('/users', { method: 'PATCH', body: JSON.stringify({ id, role }) }).then((r) => {
        invalidate('/users');
        return r;
      }),
  },
  messages: {
    list: () => request('/messages'),
    send: (content) => request('/messages', { method: 'POST', body: JSON.stringify({ content }) }),
    clear: () => request('/messages', { method: 'DELETE' }),
  },
  settings: {
    get: () => request('/settings'),
    set: (key, value) => request('/settings', { method: 'PATCH', body: JSON.stringify({ key, value }) }),
  },
  rooms: {
    state: (roomId) => request(`/rooms?room_id=${roomId}`),
    create: (missionId) => request('/rooms?action=create', { method: 'POST', body: JSON.stringify({ mission_id: missionId }) }),
    join: (code) => request('/rooms?action=join', { method: 'POST', body: JSON.stringify({ code }) }),
    start: (roomId) => request('/rooms?action=start', { method: 'POST', body: JSON.stringify({ room_id: roomId }) }),
    cancel: (roomId) => request('/rooms?action=cancel', { method: 'POST', body: JSON.stringify({ room_id: roomId }) }),
    leave: (roomId) => request('/rooms?action=leave', { method: 'POST', body: JSON.stringify({ room_id: roomId }) }),
    answer: (roomId, selectedIndex) =>
      request('/rooms?action=answer', { method: 'POST', body: JSON.stringify({ room_id: roomId, selected_index: selectedIndex }) }),
    startCards: (roomId) => request('/rooms?action=start_cards', { method: 'POST', body: JSON.stringify({ room_id: roomId }) }),
    submitCardsTime: (roomId, timeMs) =>
      request('/rooms?action=submit_cards_time', { method: 'POST', body: JSON.stringify({ room_id: roomId, time_ms: timeMs }) }),
  },
};
