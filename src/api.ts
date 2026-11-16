import type { Credentials, ProfileInput, Specialization, User } from './types.ts';

const API_URL = 'https://inai-col3.fishrungames.com/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function serverMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Сервер не смог выполнить запрос. Повторите попытку.';
  const labels: Record<string, string> = {
    username: 'Логин', password: 'Пароль', first_name: 'Имя',
    specialization: 'Специализация', bio: 'О себе', fee: 'Гонорар',
  };
  const messages = Object.entries(data).flatMap(([key, value]) => {
    const message = Array.isArray(value) ? value.filter((item) => typeof item === 'string').join(' ') : value;
    if (typeof message !== 'string') return [];
    return [labels[key] ? labels[key] + ': ' + message : message];
  });
  return messages.join(' ') || 'Сервер не смог выполнить запрос. Повторите попытку.';
}

let access: string | null = null;
const LOGOUT_KEY = 'band-members-jwt:signed-out';
function signedOut() { return typeof localStorage !== 'undefined' && localStorage.getItem(LOGOUT_KEY) === '1'; }
function rememberLogout(value: boolean) {
  if (typeof localStorage !== 'undefined') {
    if (value) localStorage.setItem(LOGOUT_KEY, '1');
    else localStorage.removeItem(LOGOUT_KEY);
  }
}
let refreshPending: Promise<string> | null = null;
export function clearAccess() { access = null; }
export function getAccessToken() { return access; }

export async function refreshAccess(): Promise<string> {
  if (signedOut()) throw new ApiError('Вы вышли из аккаунта. Войдите снова.', 401);
  if (refreshPending) return refreshPending;
  refreshPending = (async () => {
    try {
      const data = await request('/token/refresh/', { method: 'POST' }) as { access?: string };
      if (typeof data?.access !== 'string' || !data.access) throw new ApiError('Сессия истекла. Войдите снова.', 401);
      access = data.access;
      return access;
    } catch (error) { access = null; throw error; }
    finally { refreshPending = null; }
  })();
  return refreshPending;
}
async function authorized(path: string, options: RequestInit = {}): Promise<unknown> {
  const token = access ?? await refreshAccess();
  const send = (value: string) => request(path, { ...options, headers: { ...options.headers, Authorization: 'Bearer ' + value } });
  try { return await send(token); }
  catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const next = await refreshAccess();
    try { return await send(next); }
    catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) access = null;
      throw retryError;
    }
  }
}
export async function freshAccess(): Promise<string> {
  // Refresh before each WebSocket connection so expired access is never reused.
  return refreshAccess();
}
async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      ...options, headers, credentials: 'include', signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError('Не удалось подключиться к серверу. Проверьте интернет и повторите попытку.', 0);
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(serverMessage(data), response.status);
  return data;
}

function readUser(data: unknown): User {
  if (!data || typeof data !== 'object') throw new ApiError('Неверный формат профиля от сервера.', 502);
  const user = data as User;
  const profile = user.profile;
  if (!Number.isSafeInteger(user.id) || typeof user.username !== 'string' || !profile
    || typeof profile.first_name !== 'string' || typeof profile.specialization !== 'string'
    || typeof profile.specialization_display !== 'string' || typeof profile.bio !== 'string'
    || typeof profile.fee !== 'string') {
    throw new ApiError('Неверный формат профиля от сервера.', 502);
  }
  return user;
}

async function authenticate(path: string, input: Credentials): Promise<User> {
  const data = await request(path, { method: 'POST', body: JSON.stringify(input) }) as { access?: string; user?: unknown };
  if (typeof data?.access !== 'string' || !data.access) throw new ApiError('Сервер не вернул access токен.', 502);
  access = data.access;
  rememberLogout(false);
  return data.user ? readUser(data.user) : getProfile();
}
export function login(input: Credentials): Promise<User> { return authenticate('/login/', input); }
export function register(input: Credentials): Promise<User> { return authenticate('/register/', input); }
export async function getProfile(): Promise<User> { return readUser(await authorized('/profile/')); }
export async function updateProfile(input: ProfileInput): Promise<User> {
  return readUser(await authorized('/profile/', { method: 'PATCH', body: JSON.stringify(input) }));
}
export async function logout(): Promise<void> {
  rememberLogout(true);
  try { await request('/logout/', { method: 'POST' }); }
  finally { access = null; }
}
export async function getSpecializations(): Promise<Specialization[]> {
  const data = await request('/specializations/');
  if (!Array.isArray(data) || !data.every((item) => item && typeof item.value === 'string' && typeof item.label === 'string')) {
    throw new ApiError('Неверный формат списка специализаций.', 502);
  }
  return data as Specialization[];
}
