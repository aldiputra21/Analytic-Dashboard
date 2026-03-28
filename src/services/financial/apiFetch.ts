// Centralized fetch helper for FRS API
// Automatically attaches Bearer token and handles 401 by clearing session

const TOKEN_KEY = 'frs_token';
const USER_KEY = 'frs_user';

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // If 401, clear stale session so user is redirected to login
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event('frs:unauthorized'));
  }

  return res;
}
