const DEFAULT_BASE_URL = 'https://inai-col3.fishrungames.com';
const ACCESS_KEY = 'band_access_token';

const readBody = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const errorMessage = (body, fallback) => {
  if (typeof body?.detail === 'string') return body.detail;
  if (typeof body?.error === 'string') return body.error;
  const first = Object.values(body ?? {}).flat().find((value) => typeof value === 'string');
  return first ?? fallback;
};

export class ApiClient {
  constructor({
    baseUrl = DEFAULT_BASE_URL,
    fetchImpl = globalThis.fetch,
    storage = globalThis.sessionStorage,
  } = {}) {
    this.baseUrl = baseUrl;
    this.fetch = fetchImpl;
    this.storage = storage;
  }

  get accessToken() {
    return this.storage.getItem(ACCESS_KEY) ?? this.storage.getItem('access');
  }

  set accessToken(token) {
    if (token) this.storage.setItem(ACCESS_KEY, token);
    else {
      this.storage.removeItem(ACCESS_KEY);
      this.storage.removeItem('access');
    }
  }

  async request(path, options = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const body = await readBody(response);
    return { response, body };
  }

  async authenticate(path, username, password) {
    const { response, body } = await this.request(path, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error(errorMessage(body, 'Не удалось выполнить вход.'));
    this.accessToken = body.access;
    return body.user ?? { username };
  }

  register(username, password) {
    return this.authenticate('/api/register/', username, password);
  }

  login(username, password) {
    return this.authenticate('/api/login/', username, password);
  }

  async refresh() {
    const { response, body } = await this.request('/api/token/refresh/', { method: 'POST' });
    if (!response.ok || !body.access) {
      this.accessToken = null;
      throw new Error(errorMessage(body, 'Сессия закончилась. Войдите снова.'));
    }
    this.accessToken = body.access;
    return body.access;
  }

  async authorized(path, options = {}, retry = true) {
    let token = this.accessToken;
    if (!token) token = await this.refresh();
    const result = await this.request(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
    if (result.response.status === 401 && retry) {
      const next = await this.refresh();
      return this.authorized(path, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${next}` },
      }, false);
    }
    if (!result.response.ok) throw new Error(errorMessage(result.body, 'Ошибка запроса.'));
    return result.body;
  }

  profile() {
    return this.authorized('/api/profile/');
  }

  updateProfile(profile) {
    return this.authorized('/api/profile/', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }

  async logout() {
    try {
      await this.request('/api/logout/', { method: 'POST' });
    } finally {
      this.accessToken = null;
    }
  }
}

export { ACCESS_KEY, DEFAULT_BASE_URL };
