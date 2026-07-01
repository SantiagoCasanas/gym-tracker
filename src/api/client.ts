/**
 * Cliente HTTP central contra la API REST de Gym Tracker.
 * - Base URL desde `import.meta.env.VITE_API_URL`.
 * - Inyecta el JWT (localStorage `gym-tracker:token`) como `Authorization: Bearer`.
 * - Parsea JSON y lanza `Error` con el mensaje del servidor cuando la respuesta falla.
 * - En 401: limpia el token y dispara el logout/redirección a `/login`.
 */

const TOKEN_KEY = "gym-tracker:token";

/** Base de la API (sin barra final). */
export const API_URL: string = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000"
).replace(/\/+$/, "");

/** Lee el token guardado (o null). */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Guarda el token. */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Borra el token. */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Handler de 401 configurable por la capa de sesión.
 * Al montar, `SessionContext` registra aquí su `logout` para reaccionar a 401
 * sin acoplar el cliente HTTP a React.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/** Antepone la base URL a una ruta relativa del servidor (ej. `/uploads/x.jpg`). */
export function toAbsoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Extrae un mensaje de error legible del cuerpo de la respuesta. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const data = await res.clone().json();
    if (data && typeof data === "object") {
      const msg = (data.message ?? data.error) as unknown;
      if (typeof msg === "string" && msg.trim()) return msg;
    }
  } catch {
    /* cuerpo no-JSON: caemos al texto plano */
  }
  try {
    const text = await res.text();
    if (text.trim()) return text;
  } catch {
    /* ignore */
  }
  return `Error ${res.status}`;
}

/** Maneja un 401: limpia token y dispara el handler registrado. */
function handleUnauthorized(): void {
  clearToken();
  if (onUnauthorized) {
    onUnauthorized();
  } else if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

interface FetchOptions {
  method?: string;
  /** Cuerpo JSON (se serializa y fija `Content-Type: application/json`). */
  json?: unknown;
  /** Cuerpo crudo (FormData para multipart; NO se fija Content-Type). */
  body?: BodyInit;
  headers?: Record<string, string>;
  /** Si true, no adjunta el token (login / endpoints públicos). */
  skipAuth?: boolean;
  /** Si true, devuelve el Blob crudo (descargas) en vez de parsear JSON. */
  blob?: boolean;
}

/**
 * Realiza una petición a la API. Devuelve el JSON parseado (`T`), o el Blob
 * si `blob:true`. Lanza `Error` con el mensaje del servidor si !res.ok.
 */
export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOptions = {}
): Promise<T> {
  const { method, json, body, headers = {}, skipAuth, blob } = opts;

  const finalHeaders: Record<string, string> = { ...headers };
  let finalBody: BodyInit | undefined = body;

  if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    finalBody = JSON.stringify(json);
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path.startsWith("/") ? "" : "/"}${path}`, {
    method: method ?? (finalBody !== undefined ? "POST" : "GET"),
    headers: finalHeaders,
    body: finalBody,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
  }

  if (!res.ok) {
    throw new Error(await errorMessage(res));
  }

  if (blob) {
    return (await res.blob()) as unknown as T;
  }

  // 204 / sin cuerpo → undefined.
  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}

/**
 * Helper para peticiones multipart. Recibe un FormData y NO fija Content-Type
 * (el navegador añade el boundary correcto). Inyecta el token salvo `skipAuth`.
 */
export async function apiUpload<T = unknown>(
  path: string,
  form: FormData,
  opts: { method?: string; skipAuth?: boolean } = {}
): Promise<T> {
  return apiFetch<T>(path, {
    method: opts.method ?? "POST",
    body: form,
    skipAuth: opts.skipAuth,
  });
}
