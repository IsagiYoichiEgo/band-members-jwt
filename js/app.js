import { ApiClient } from './api.js';

const api = new ApiClient();
const authView = document.querySelector('#auth-view');
const profileView = document.querySelector('#profile-view');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const profileForm = document.querySelector('#profile-form');
const authStatus = document.querySelector('#auth-status');
const profileStatus = document.querySelector('#profile-status');
const loginTab = document.querySelector('#login-tab');
const registerTab = document.querySelector('#register-tab');

const setStatus = (element, message = '', type = '') => {
  element.textContent = message;
  element.className = `form-status${type ? ` is-${type}` : ''}`;
};

const setBusy = (form, busy) => {
  form.querySelectorAll('button, input, textarea, select').forEach((control) => { control.disabled = busy; });
};

const chooseTab = (mode) => {
  const login = mode === 'login';
  loginForm.hidden = !login;
  registerForm.hidden = login;
  loginTab.classList.toggle('is-active', login);
  registerTab.classList.toggle('is-active', !login);
  loginTab.setAttribute('aria-selected', String(login));
  registerTab.setAttribute('aria-selected', String(!login));
  setStatus(authStatus);
};

const fillProfile = (user) => {
  document.querySelector('#profile-username').textContent = `@${user.username}`;
  const data = user.profile ?? {};
  ['first_name', 'specialization', 'bio', 'fee'].forEach((name) => {
    profileForm.elements[name].value = data[name] ?? '';
  });
};

const showProfile = async () => {
  const user = await api.profile();
  fillProfile(user);
  authView.hidden = true;
  profileView.hidden = false;
  setStatus(profileStatus);
};

const submitAuth = (mode) => async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  setBusy(form, true);
  setStatus(authStatus, mode === 'login' ? 'Проверяем данные…' : 'Создаём аккаунт…');
  try {
    await api[mode](values.get('username').trim(), values.get('password'));
    await showProfile();
    form.reset();
  } catch (error) {
    setStatus(authStatus, error.message, 'error');
  } finally {
    setBusy(form, false);
  }
};

loginTab.addEventListener('click', () => chooseTab('login'));
registerTab.addEventListener('click', () => chooseTab('register'));
loginForm.addEventListener('submit', submitAuth('login'));
registerForm.addEventListener('submit', submitAuth('register'));

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(profileForm);
  const profile = Object.fromEntries(formData.entries());
  setBusy(profileForm, true);
  setStatus(profileStatus, 'Сохраняем…');
  try {
    const user = await api.updateProfile(profile);
    fillProfile(user);
    setStatus(profileStatus, 'Профиль сохранён.', 'success');
  } catch (error) {
    setStatus(profileStatus, error.message, 'error');
  } finally {
    setBusy(profileForm, false);
  }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  try { await api.logout(); } finally {
    profileView.hidden = true;
    authView.hidden = false;
    chooseTab('login');
    setStatus(authStatus, 'Вы вышли из аккаунта.');
  }
});

const restoreSession = async () => {
  setStatus(authStatus, 'Проверяем сессию…');
  try {
    if (!api.accessToken) await api.refresh();
    await showProfile();
  } catch {
    api.accessToken = null;
    setStatus(authStatus);
  }
};

restoreSession();
