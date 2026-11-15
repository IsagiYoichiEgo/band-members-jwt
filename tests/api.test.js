import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../js/api.js';

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const storage = () => {
  let value = null;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
    removeItem: () => { value = null; },
  };
};

test('login stores the returned access token and sends cookies', async () => {
  const calls = [];
  const store = storage();
  const api = new ApiClient({
    storage: store,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response(200, { access: 'access-1', user: { username: 'mira' } });
    },
  });

  const user = await api.login('mira', 'secret12');

  assert.equal(user.username, 'mira');
  assert.equal(store.getItem('access'), 'access-1');
  assert.equal(calls[0].options.credentials, 'include');
  assert.deepEqual(JSON.parse(calls[0].options.body), { username: 'mira', password: 'secret12' });
});

test('profile refreshes once after 401 and retries with the new bearer token', async () => {
  const calls = [];
  const queue = [
    response(401, { detail: 'expired' }),
    response(200, { access: 'access-2' }),
    response(200, { username: 'mira', profile: {} }),
  ];
  const store = storage();
  store.setItem('access', 'access-1');
  const api = new ApiClient({
    storage: store,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return queue.shift();
    },
  });

  const profile = await api.profile();

  assert.equal(profile.username, 'mira');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer access-1');
  assert.equal(calls[1].url.endsWith('/api/token/refresh/'), true);
  assert.equal(calls[1].options.credentials, 'include');
  assert.equal(calls[2].options.headers.Authorization, 'Bearer access-2');
});

test('logout clears the local access token even when the request succeeds', async () => {
  const store = storage();
  store.setItem('access', 'access-1');
  const api = new ApiClient({ storage: store, fetchImpl: async () => response(200, { detail: 'ok' }) });

  await api.logout();

  assert.equal(store.getItem('access'), null);
});
