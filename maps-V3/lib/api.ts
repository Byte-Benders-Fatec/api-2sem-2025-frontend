import * as SecureStore from 'expo-secure-store';

// URL do serviço de autenticação (MySQL)
const AUTH_SERVICE_URL = process.env.EXPO_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:5000/api/v1';

async function getToken() {
  return SecureStore.getItemAsync('access_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${AUTH_SERVICE_URL}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
