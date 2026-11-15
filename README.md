# LOUDROOM — JWT registration

Отдельное задание: сайт регистрации участников музыкальной группы с JWT access/refresh авторизацией.

## Возможности

- регистрация и вход;
- access-токен в `sessionStorage`;
- refresh-токен в HttpOnly cookie бекенда;
- автоматический refresh после `401`;
- просмотр и редактирование профиля;
- logout с очисткой сессии.

Откройте `index.html` через локальный HTTP-сервер или GitHub Pages. Тесты: `npm test`.
