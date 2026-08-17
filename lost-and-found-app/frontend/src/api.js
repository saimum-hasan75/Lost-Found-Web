const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function getSavedUser() {
  try {
    const raw = localStorage.getItem('lost_found_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setAuthSession(user) {
  if (user) {
    localStorage.setItem('lost_found_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('lost_found_user');
  }
}

export function clearAuthSession() {
  localStorage.removeItem('lost_found_user');
}

async function request(endpoint, options = {}) {
  const user = getSavedUser();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (user && user.id) {
    headers['x-user-id'] = String(user.id);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && user) {
      if (!endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register') && !endpoint.startsWith('/auth/google')) {
        clearAuthSession();
      }
    }
    throw new Error(data.message || 'An error occurred while communicating with the server.');
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  googleLogin: (profile) =>
    request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),

  getMe: () => request('/auth/me'),

  updateMe: (payload) =>
    request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getUsers: () => request('/auth/users'),

  deleteUser: (id) =>
    request(`/auth/users/${id}`, {
      method: 'DELETE',
    }),

  // Items
  getItems: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return request(`/items${query ? `?${query}` : ''}`);
  },

  getMyItems: () => request('/items/my'),

  getItem: (id) => request(`/items/${id}`),

  getCategories: () => request('/items/categories'),

  getAdminStats: () => request('/items/admin/stats'),

  createItem: (payload) =>
    request('/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateItem: (id, payload) =>
    request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateStatus: (id, status) =>
    request(`/items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteItem: (id) =>
    request(`/items/${id}`, {
      method: 'DELETE',
    }),
};
