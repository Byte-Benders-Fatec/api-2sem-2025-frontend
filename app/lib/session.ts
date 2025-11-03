import * as SecureStore from 'expo-secure-store';
import { api } from './api';

// Tipagem do retorno de /auth/me
export type MeResponse = {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  system_role: string;
  api_key?: string;
  scope?: string;
  iat?: number;
  exp?: number;
};

// Centraliza todas as chaves de armazenamento seguro
export const STORAGE_DATA = {
  PROFILE: 'user_profile',
  GEO_API_KEY: 'geo_api_key',
  ACCESS_TOKEN: 'access_token',
  TEMP_TOKEN: 'temp_token',
} as const;

// PROFILE / USER SESSION
export async function loadProfile(): Promise<MeResponse | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_DATA.PROFILE);
  return raw ? JSON.parse(raw) : null;
}

export async function saveProfile(p: MeResponse) {
  await SecureStore.setItemAsync(STORAGE_DATA.PROFILE, JSON.stringify(p));
  if (p.api_key) {
    await SecureStore.setItemAsync(STORAGE_DATA.GEO_API_KEY, p.api_key);
  }
}

export async function getGeoApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_DATA.GEO_API_KEY);
}

// ACCESS TOKEN
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_DATA.ACCESS_TOKEN);
}

export async function setAccessToken(token: string) {
  await SecureStore.setItemAsync(STORAGE_DATA.ACCESS_TOKEN, token);
}

// TEMP TOKEN
export async function getTempToken(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_DATA.TEMP_TOKEN);
}

export async function setTempToken(token: string) {
  await SecureStore.setItemAsync(STORAGE_DATA.TEMP_TOKEN, token);
}

// Atualiza todos os dados da sessão a partir do servidor
export async function refreshSession() {
  const me = await api<MeResponse>('/auth/me', { method: 'GET' });
  await saveProfile(me);
  return me;
}

// Remove todos os dados salvos no SecureStore
export async function clearSession() {
  for (const key of Object.values(STORAGE_DATA)) {
    await SecureStore.deleteItemAsync(key);
  }
}
