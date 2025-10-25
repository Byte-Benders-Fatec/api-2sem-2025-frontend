import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!; 

async function getToken() {
  return SecureStore.getItemAsync('access_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
