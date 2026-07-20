// ============================================================================
// Este archivo es el ÚNICO lugar del frontend que sabe cómo hablar con
// nuestro backend (api/*.js en Vercel). Cualquier página/componente que
// necesite datos usa `api.algo.metodo(...)` en vez de hacer fetch() directo:
// así, si un endpoint cambia de URL, solo se corrige aquí una vez.
// ============================================================================
const BASE = '/api';

// Cache en memoria (vive mientras la pestaña esté abierta) para evitar
// refetch innecesario de datos que casi no cambian (misiones, ranking).
// Es solo un Map en RAM del navegador, no localStorage ni nada persistente:
// al recargar la página se pierde y se vuelve a pedir todo, lo cual es
// intencional (no queremos mostrar datos viejos por mucho tiempo).
const cache = new Map();
const CACHE_TTL_MS = 30_000; // 30 segundos de "frescura" antes de repetir el fetch

// Wrapper sobre fetch(): agrega el prefijo /api, manda credentials:'include'
// (para que viaje la cookie de sesión cq_token) y convierte respuestas de
// error HTTP en excepciones JS normales que se pueden atrapar con try/catch.
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

// GET con cache: si ya pedimos esta misma ruta hace menos de 30s, devuelve
// el resultado guardado en vez de volver a pedirlo al servidor.
async function cachedGet(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.time < CACHE_TTL_MS) return hit.data;
  const data = await request(path);
  cache.set(path, { data, time: Date.now() });
  return data;
}

// Borra del cache cualquier entrada cuya ruta empiece por `prefix`.
// Se llama después de un POST/PATCH que modifica datos (ej: al enviar un
// ejercicio se invalida '/ranking' porque el puntaje pudo cambiar), para
// que la próxima lectura traiga el dato actualizado en vez del viejo.
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
    update: (data) => request('/profile', { method: 'PATCH', body: JSON.stringify(data) }),
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
  exercisesAudit: {
    scan: () => request('/exercises-audit'),
    disable: (ids) => request('/exercises-audit', { method: 'PATCH', body: JSON.stringify({ ids }) }),
  },
};
