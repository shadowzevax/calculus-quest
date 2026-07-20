const BASE = '/api';

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

export const api = {
  missions: {
    list: (module = 'misiones') => request(`/missions?module=${module}`),
  },
  exercises: {
    byMission: (missionId) => request(`/exercises?mission_id=${missionId}`),
  },
  progress: {
    list: () => request('/progress'),
    submit: (data) => request('/progress', { method: 'POST', body: JSON.stringify(data) }),
  },
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
  },
};
