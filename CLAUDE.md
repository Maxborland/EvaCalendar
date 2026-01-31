# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EvaCalendar — персональный ADHD-ориентированный еженедельный планировщик для отслеживания событий, задач и финансовых расходов. Монорепо с двумя независимыми проектами: `back/` (API) и `front/` (SPA/PWA). Интерфейс и комментарии на русском языке.

## Commands

### Backend (`back/`)

```bash
npm install                # установка зависимостей
npm run dev                # dev-сервер (nodemon)
npm start                  # production: node index.js
npm test                   # Jest тесты (in-memory SQLite)
npm run migrate:latest     # применить миграции Knex
npm run migrate:rollback   # откатить миграции
npm run migrate:make       # создать новую миграцию
npm run seed               # заполнить БД начальными данными
```

### Frontend (`front/`)

```bash
npm install        # установка зависимостей
npm run dev        # Vite dev-сервер (порт 5173, проксирует /api на localhost:3001)
npm run build      # TypeScript проверка + Vite production сборка
npm run lint       # ESLint
npm run test       # Vitest (unit-тесты)
npm run test:e2e   # Playwright E2E (Chromium, Firefox, WebKit)
npm run preview    # предпросмотр production сборки
```

### Docker

```bash
docker-compose up --build  # поднять backend (порт 3001) + frontend (порт 5005)
```

### Запуск одного теста

```bash
# Backend: один файл
cd back && npx jest tests/auth.test.js

# Frontend: один файл
cd front && npx vitest run src/components/SomeComponent.test.tsx

# Frontend E2E: один файл
cd front && npx playwright test tests/some.spec.ts
```

## Architecture

### Backend (`back/`) — Node.js + Express 5 + SQLite (Knex)

Слоистая архитектура (controllers → services → DB):

- `index.js` — главная точка входа: Express app, middleware, маршруты, rate limiting, graceful shutdown, cron-планировщик
- `controllers/` — обработка HTTP-запросов (некоторые контроллеры экспортируют Router напрямую и монтируются в index.js)
- `services/` — бизнес-логика и запросы к БД через Knex
- `routes/` — Express Router (authRoutes, userRoutes, notificationRoutes, subscriptionRoutes)
- `middleware/` — JWT-аутентификация (`protect`), ролевая авторизация (`authorize`), обработчик ошибок
- `utils/` — `ApiError` (кастомный класс с фабричными методами для HTTP-ошибок), logger
- `config/env.js` — централизованная валидация переменных окружения при старте
- `scheduler.js` — cron-задача проверки напоминаний каждую минуту (push + email)
- `migrations/` — Knex миграции SQLite
- `db.cjs` / `knexfile.cjs` — конфигурация подключения к БД (CommonJS)

Backend использует CommonJS (`require()`). Тесты — Jest + Supertest, in-memory SQLite (jest.setup.js запускает миграции и seed перед каждым файлом).

### Frontend (`front/`) — React 19 + TypeScript + Vite + Tailwind CSS v4

- `src/main.tsx` — корневой рендер: QueryClientProvider, DndProvider, AuthProvider, ToastContainer, SW-регистрация
- `src/App.tsx` — роутер (`createBrowserRouter`), дерево маршрутов, PageLoader
- `src/components/` — переиспользуемые UI-компоненты
- `src/pages/` — страницы (привязаны к маршрутам)
- `src/context/` — React Context (Auth, Task, Nav)
- `src/hooks/` — кастомные хуки на TanStack React Query v5 (useTasks, useNotes, useChildren, useExpenseCategories)
- `src/services/` — API-клиент (Axios с интерцепторами для JWT и редиректа на 401)
- `src/lib/` — queryClient с IndexedDB-персистентностью, offlineQueue
- `src/utils/` — утилиты (dateUtils.ts — форматирование дат с русской локалью)
- `src/styles/theme.css` — глобальные стили / тема

**Ключевые паттерны фронтенда:**
- Оптимистичные обновления через TanStack React Query
- Offline-first: очередь мутаций в IndexedDB при отсутствии сети
- Защищённые маршруты: `PrivateRoute` (с `allowedRoles`) и `PublicOnlyRoute`
- Drag-and-drop: react-dnd (HTML5 + Touch бэкенды)
- PWA: vite-plugin-pwa (service worker, manifest, offline)

### API

REST API, все маршруты с префиксом `/api/`. JWT Bearer-токен в заголовке Authorization. Роли: `admin`, `user`. Основные группы эндпоинтов: auth, users, tasks, children, expense-categories, notes, summary, subscriptions, notifications.

### Database

SQLite через Knex.js. Файл БД: `back/data/database.sqlite` (dev/prod), `:memory:` (test). Основные таблицы: `users`, `tasks`, `children`, `expense_categories`, `notes`, `notification_subscriptions`, `token_blacklist`, `password_reset_tokens`. UUID как первичные ключи.

## Environment Variables

Backend (`back/.env`) — все обязательные, валидируются при старте:
- `NODE_ENV`, `PORT`, `JWT_SECRET` (мин. 32 символа)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` — push-уведомления
- `FRONTEND_URL` — разрешённые origins (через запятую)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` — SMTP
- `DISABLE_RATE_LIMITS_FOR_E2E` — отключить rate limiting для E2E тестов

Frontend (`front/.env`):
- `VITE_API_URL` — базовый URL API (пустой или `/api` в production)
- `VITE_DISABLE_SW` — отключить service worker при разработке
- `VITE_DADATA_API_KEY`, `VITE_DADATA_SECRET_KEY`, `VITE_DADATA_SUGGESTION_URL` — DaData (подсказки адресов)

## Coding Standards (from .voidrules)

- Функции не более 20 строк, цикломатическая сложность < 10
- `const`/`let`, никогда `var`; `===` вместо `==`
- Максимум 3 уровня вложенности
- Валидировать весь внешний ввод
- Без `console.log` в production-коде
- Кастомные классы ошибок (`ApiError`), никогда не глушить ошибки
- Guard clauses перед операциями
- Без inline-стилей в React — использовать CSS
- Atomic commits с conventional commit messages
