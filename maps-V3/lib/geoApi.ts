import { getGeoApiKey, refreshSession } from './session';

const GEO_BASE_URL = process.env.EXPO_PUBLIC_GEO_API_BASE_URL || 'http://localhost:3001/api/v1';

function isJsonResponse(res: Response) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

async function buildHeaders(extra?: HeadersInit) {
  let apiKey = await getGeoApiKey();

  // Se ainda não temos chave (primeiro uso / app recém-aberto), tenta hidratar via /auth/me
  if (!apiKey) {
    await refreshSession();
    apiKey = await getGeoApiKey();
  }

  if (!apiKey) {
    // Se mesmo após refresh ainda não houver, falha cedo e claro
    throw new Error('GEO API key ausente. Faça login novamente.');
  }

  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...(extra || {}),
  } as HeadersInit;
}

export async function geoApi<T>(
  path: string,
  options: RequestInit = {},
  canRetry = true
): Promise<T> {
  const headers = await buildHeaders(options.headers);
  const res = await fetch(`${GEO_BASE_URL}${path}`, { ...options, headers });

  // Se a GEO rejeitar por auth, renove sessão e tente 1x novamente
  if ((res.status === 401 || res.status === 403) && canRetry) {
    await refreshSession();
    const retryHeaders = await buildHeaders(options.headers);
    const retryRes = await fetch(`${GEO_BASE_URL}${path}`, {
      ...options,
      headers: retryHeaders,
    });

    if (!retryRes.ok) {
      const fallback = retryRes.statusText || `HTTP ${retryRes.status}`;
      const message = await retryRes.text().catch(() => fallback);
      throw new Error(message || fallback);
    }

    if (retryRes.status === 204 || retryRes.status === 205) {
      return null as unknown as T;
    }
    if (isJsonResponse(retryRes)) {
      return (await retryRes.json()) as T;
    }
    return (await retryRes.text()) as unknown as T;
  }

  if (!res.ok) {
    const fallback = res.statusText || `HTTP ${res.status}`;
    const message = await res.text().catch(() => fallback);
    throw new Error(message || fallback);
  }

  if (res.status === 204 || res.status === 205) {
    return null as unknown as T;
  }
  if (isJsonResponse(res)) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

/* Helpers específicos para imóveis */

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

export async function fetchImoveisByCPF(cpf: string) {
  return geoApi<any[]>(`/imoveis/cpf/${cpf}`);
}

export async function fetchImovelById(id: string) {
  return geoApi<any>(`/imoveis/${id}`);
}
