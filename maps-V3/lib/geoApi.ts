// lib/geoApi.ts
import * as SecureStore from 'expo-secure-store';

const GEO_BASE_URL = process.env.EXPO_PUBLIC_GEO_API_BASE_URL || 'http://localhost:3001/api/v1';
const GEO_API_KEY_KEY = 'secondary_api_key';

export async function geoApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = await SecureStore.getItemAsync(GEO_API_KEY_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${GEO_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Helpers específicos para imóveis:
export async function fetchImoveisViewport(params: {
  bbox: string; // "minLon,minLat,maxLon,maxLat"
  limit?: number;
  mode?: 'intersects' | 'within';
}) {
  const { bbox, limit = 200, mode = 'intersects' } = params;
  return geoApi<any[]>(
    `/imoveis/viewport?bbox=${encodeURIComponent(bbox)}&limit=${limit}&mode=${mode}`
  );
}

export async function fetchImoveisNear(params: {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}) {
  const { lat, lng, radiusKm = 1, limit = 10 } = params;
  return geoApi<any[]>(
    `/imoveis/near?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&limit=${limit}`
  );
}

// Nova função para buscar imóveis por CPF
export async function fetchImoveisByCPF(cpf: string) {
  return geoApi<any[]>(`/imoveis/cpf/${cpf}`);
}

// Nova função para buscar detalhes de um imóvel específico
export async function fetchImovelById(id: string) {
  return geoApi<any>(`/imoveis/${id}`);
}
