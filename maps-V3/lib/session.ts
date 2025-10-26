import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export type MeResponse = {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  system_role: string;
  api_key?: string;      // <- chave para o segundo backend
  scope?: string;
  iat?: number;
  exp?: number;
};

const PROFILE_KEY = 'user_profile';
const GEO_API_KEY_KEY = 'secondary_api_key'; // x-api-key

export async function loadProfile(): Promise<MeResponse | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveProfile(p: MeResponse) {
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(p));
  if (p.api_key) {
    await SecureStore.setItemAsync(GEO_API_KEY_KEY, p.api_key);
  }
}

export async function getGeoApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(GEO_API_KEY_KEY);
}

// Chamar após login bem-sucedido:
export async function hydrateSessionFromMe() {
  const me = await api<MeResponse>('/me', { method: 'GET' });
  await saveProfile(me);
  return me;
}
