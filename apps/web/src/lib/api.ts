const BASE = '/api';

// Decode JWT payload without verifying signature (client-side only)
export function getTokenPayload(): { exp?: number; sub?: string; email?: string } | null {
  const token = localStorage.getItem('mappra_token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function isTokenValid(): boolean {
  const payload = getTokenPayload();
  if (!payload) return false;
  if (!payload.exp) return true; // no expiry claim → treat as valid
  return payload.exp * 1000 > Date.now();
}

function handleUnauthorized() {
  localStorage.removeItem('mappra_token');
  window.location.href = '/login';
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('mappra_token');

  // Pre-flight token expiry check
  if (token && !isTokenValid()) {
    handleUnauthorized();
    throw new Error('Sesión expirada');
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
