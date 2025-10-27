import { getAccessToken, getTempToken, clearSession } from './session';

// URL do serviço de autenticação (MySQL)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

type AuthMode = 'auto' | 'access' | 'temp' | 'none';

type ApiOptions = Omit<RequestInit, 'headers' | 'body'> & {
  /** 'access' (padrão), 'temp' (p/ finalize-login), 'auto' (tenta access, depois temp), 'none' */
  auth?: AuthMode;
  /** Headers extras */
  headers?: HeadersInit;
  /** Corpo como objeto (serializado) ou BodyInit pronto */
  body?: any;
  /** Se enviar FormData, passe aqui (não seta Content-Type manualmente) */
  formData?: FormData;
  /** Força retorno como texto bruto */
  asText?: boolean;
  /** Em auth='access' | 'auto', limpar sessão ao receber 401 (padrão: true) */
  clearOn401?: boolean;
};

function isJsonResponse(res: Response) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

async function resolveToken(mode: AuthMode): Promise<string | undefined> {
  if (mode === 'none') return undefined;
  if (mode === 'access') return (await getAccessToken()) || undefined;
  if (mode === 'temp') return (await getTempToken()) || undefined;
  // auto: tenta access, senão temp
  return (await getAccessToken()) || (await getTempToken()) || undefined;
}

async function buildHeaders(
  auth: AuthMode,
  extra?: HeadersInit,
  useFormData?: boolean
): Promise<HeadersInit> {
  const token = await resolveToken(auth);
  return {
    ...(useFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
}

export async function api<T = any>( path: string, opts: ApiOptions = {} ): Promise<T> {
  const {
    auth = 'access',
    formData,
    body: rawBody,
    asText = false,
    clearOn401 = true,
    headers: extraHeaders,
    ...init
  } = opts as ApiOptions;

  const headers = await buildHeaders(auth, extraHeaders, !!formData);

  const body =
    formData ??
    (rawBody !== undefined && typeof rawBody !== 'string'
      ? JSON.stringify(rawBody)
      : (rawBody as BodyInit | null | undefined));

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, body });

  if ((auth === 'access' || auth === 'auto') && res.status === 401 && clearOn401) {
    // sessão inválida/expirada — limpe e deixe o chamador redirecionar
    await clearSession();
  }

  if (!res.ok) {
    const fallback = res.statusText || `HTTP ${res.status}`;
    const message = await res.text().catch(() => fallback);
    throw new Error(message || fallback);
  }

  if (res.status === 204 || res.status === 205) {
    return null as unknown as T;
  }

  if (asText || !isJsonResponse(res)) {
    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}

// Helpers:

export async function getJson<T = any>(path: string, opts: Omit<ApiOptions, 'method' | 'body'> = {}) {
  return api<T>(path, { ...opts, method: 'GET' });
}

export async function postJson<T = any, B = unknown>(path: string, body: B, opts: Omit<ApiOptions, 'method' | 'body' | 'formData'> = {}) {
  return api<T>(path, { ...opts, method: 'POST', body });
}

export async function putJson<T = any, B = unknown>(path: string, body: B, opts: Omit<ApiOptions, 'method' | 'body' | 'formData'> = {}) {
  return api<T>(path, { ...opts, method: 'PUT', body });
}

export async function patchJson<T = any, B = unknown>(path: string, body: B, opts: Omit<ApiOptions, 'method' | 'body' | 'formData'> = {}) {
  return api<T>(path, { ...opts, method: 'PATCH', body });
}

export async function deleteJson<T = any>(path: string,  opts: Omit<ApiOptions, 'method'> = {}) {
  return api<T>(path, { ...opts, method: 'DELETE' });
}

export async function postForm<T = any>(path: string, form: FormData, opts: Omit<ApiOptions, 'method' | 'body' | 'formData'> = {}) {
  return api<T>(path, { ...opts, method: 'POST', formData: form });
}
