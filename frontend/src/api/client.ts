const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export function get(path: string) {
  return request(path, { method: 'GET' });
}

export function post(path: string, body: unknown) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function del(path: string) {
  return request(path, { method: 'DELETE' });
}

const apiClient = { get, post, del };
export default apiClient;
