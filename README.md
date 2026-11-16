# Thunder bend — участники группы с JWT

Отдельное учебное задание на React + TypeScript. Основа — прежняя работа Thunder bend (ДЗ8). Сборка Vite без Babel. Публикация из main через GitHub Actions.

## Возможности
- Регистрация, вход, logout.
- Просмотр и редактирование имени, специализации, информации о себе и гонорара.
- Специализации загружаются из API.
- Состояния загрузки, сообщения об ошибках и проверки формы.

## JWT
API: https://inai-col3.fishrungames.com/api/docs/
Access токен хранится в памяти, отправляется как Authorization: Bearer.
Refresh токен устанавливает сервер в HttpOnly cookie. Запросы используют credentials: include.
После перезагрузки access восстанавливается POST /api/token/refresh/.
При 401 защищённый запрос обновляет access и повторяется один раз. Одновременные refresh объединяются.
Logout вызывает сервер и очищает локальный access даже при ошибке; ошибка отображается пользователю.
Для восстановления сессии браузер должен разрешать cookie учебного API.
На 16.11.2026 logout сервера не удаляет refresh_token с путём /api/. Поэтому frontend сохраняет отметку выхода (без токенов и паролей) и не восстанавливает вход до следующей успешной авторизации. Удаление самой HttpOnly-cookie должен исправить backend.

## Запуск
Node.js 24.
```sh
npm ci
npm test
npm run build
npm run dev
```
Не открывайте index.html как файл.

## Публикация
Settings → Pages → Source: GitHub Actions.
Push в main запускает тесты, проверку TypeScript, сборку dist и публикацию.
Ветка gh-pages не используется.
Сайт: https://isagiyoichiego.github.io/band-members-jwt/

