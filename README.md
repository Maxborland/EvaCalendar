## **Документация**

### **Введение**
Это приложение EvaCalendar, предназначенное для отслеживания событий по неделям, включая задачи и финансовые расходы.

### **Структура Проекта**
Проект разделен на две основные части:
- `back/`: Бэкенд-приложение (API) на Node.js с использованием Express.js.
- `front/`: Фронтенд-приложение на React с использованием Vite и TypeScript.

### **Бэкенд (`back/`)**

**Технологии:**
- Node.js
- Express.js (веб-фреймворк)
- Knex.js (конструктор запросов SQL, используется для миграций и сидов)
- SQLite3 (база данных)
- Jest (тестирование)
- PM2 (продакшн-менеджер процессов)

**Установка:**
1. Перейдите в директорию `back/`: `cd back/`
2. Установите зависимости: `npm install`
3. Запустите миграции для создания таблиц базы данных: `npx knex migrate:latest --knexfile ./knexfile.cjs`
4. Запустите сидеры для заполнения начальных данных (если есть): `npx knex seed:run --knexfile ./knexfile.cjs`

**Запуск:**
- **Режим разработки:** `npm start` (или `node index.js`)
- **Режим продакшена (с PM2):** `pm2 start pm2.config.js`

**Архитектура:**
- **`controllers/`:** Обрабатывают HTTP-запросы и вызывают соответствующие сервисы (например, [`authController.js`](back/controllers/authController.js:1), [`taskController.js`](back/controllers/taskController.js:1), [`childrenController.js`](back/controllers/childrenController.js:1)).
- **`middleware/`:** Промежуточное ПО для обработки запросов (например, [`authMiddleware.js`](back/middleware/authMiddleware.js:1) для аутентификации, [`errorHandler.js`](back/middleware/errorHandler.js:1) для обработки ошибок).
- **`migrations/`:** Управляют схемой базы данных через Knex.js (например, [`20250604205706_create_users_and_password_reset_tokens.js`](back/migrations/20250604205706_create_users_and_password_reset_tokens.js:1)).
- **`routes/`:** Определяют маршруты API, связывая пути с контроллерами (например, [`authRoutes.js`](back/routes/authRoutes.js:1), [`userRoutes.js`](back/routes/userRoutes.js:1)). Судя по наличию контроллеров, вероятно также существуют `taskRoutes.js`, `childrenRoutes.js` и т.д.
- **`seeds/`:** Файлы для заполнения базы данных начальными данными (например, [`01_add_admin_user.js`](back/seeds/01_add_admin_user.js:1)).
- **`services/`:** Содержат бизнес-логику приложения и взаимодействуют с моделями или напрямую с базой данных (например, [`taskService.js`](back/services/taskService.js:1), `userService.js`, [`summaryService.js`](back/services/summaryService.js:1)).
- **`tests/`:** Автоматизированные тесты для проверки функциональности (например, [`auth.test.js`](back/tests/auth.test.js:1), [`tasks.test.js`](back/tests/tasks.test.js:1)).
- **`utils/`:** Вспомогательные модули и классы (например, [`ApiError.js`](back/utils/ApiError.js:1) для стандартизации ошибок API).
- **[`db.cjs`](back/db.cjs:1):** Модуль для инициализации и подключения к базе данных SQLite с использованием Knex.js.
- **[`index.js`](back/index.js:1):** Входная точка бэкенд-приложения: настройка Express, подключение middleware, определение маршрутов.
- **[`knexfile.cjs`](back/knexfile.cjs:1):** Конфигурационный файл для Knex.js, определяющий параметры подключения к базе данных для различных окружений.
- **[`pm2.config.js`](back/pm2.config.js:1):** Конфигурационный файл для PM2, менеджера процессов для Node.js в продакшене.
- **[`package.json`](back/package.json):** Определяет зависимости проекта, скрипты сборки и запуска.

### **Фронтенд (`front/`)**

**Технологии:**
- React (UI-библиотека)
- Vite (инструмент сборки)
- TypeScript (язык программирования)
- Tailwind CSS (CSS-фреймворк для утилитарных классов)
- Jest / React Testing Library (тестирование)

**Установка:**
1. Перейдите в директорию `front/`: `cd front/`
2. Установите зависимости: `npm install`

**Запуск:**
- **Режим разработки:** `npm run dev`
- **Сборка для продакшена:** `npm run build` (создает папку `dist/`)

**Архитектура:**
- **`public/`:** Директория для статических ассетов, таких как базовый [`index.html`](front/index.html:1) (шаблон Vite), иконки ([`favicon.ico`](front/public/favicon.ico), директории `icons/`), [`manifest.json`](front/public/manifest.json) и [`sw.js`](front/public/sw.js) для поддержки Progressive Web App (PWA).
- **`src/components/`:** Переиспользуемые UI-компоненты, из которых строится интерфейс (например, [`WeekView.tsx`](front/src/components/WeekView.tsx:1), [`DayColumn.tsx`](front/src/components/DayColumn.tsx:1), [`UnifiedTaskFormModal.tsx`](front/src/components/UnifiedTaskFormModal.tsx:1), [`TopNavigator.tsx`](front/src/components/TopNavigator.tsx:1)).
- **`src/context/`:** React Context API для управления глобальным состоянием приложения, таким как аутентификация пользователя ([`AuthContext.tsx`](front/src/context/AuthContext.tsx:1)) или состояние навигации ([`NavContext.tsx`](front/src/context/NavContext.tsx:1)).
- **`src/pages/`:** Компоненты, представляющие собой отдельные страницы или экраны приложения (например, [`DashboardPage.tsx`](front/src/pages/DashboardPage.tsx:1), [`Auth/LoginPage.tsx`](front/src/pages/Auth/LoginPage.tsx:1), [`SettingsPage.tsx`](front/src/pages/SettingsPage.tsx:1), [`DayDetailsPage.tsx`](front/src/pages/DayDetailsPage.tsx:1)).
- **`src/services/`:** Модули для взаимодействия с внешними API, в основном с бэкендом ([`api.ts`](front/src/services/api.ts:1)).
- **`src/styles/`:** Глобальные стили, темы и конфигурации стилей (например, [`index.css`](front/src/index.css:1), [`theme.css`](front/src/styles/theme.css:1)).
- **`src/utils/`:** Вспомогательные функции и утилиты, используемые в различных частях приложения (например, [`dateUtils.ts`](front/src/utils/dateUtils.ts:1)).
- **[`src/App.tsx`](front/src/App.tsx:1):** Корневой компонент React-приложения, где определяется основная структура пользовательского интерфейса и маршрутизация с использованием React Router.
- **[`src/main.tsx`](front/src/main.tsx:1):** Точка входа для React-приложения, где корневой компонент `App` монтируется в DOM.
- **[`vite.config.ts`](front/vite.config.ts:1):** Конфигурационный файл для Vite, управляющий процессом сборки и разработки фронтенда.
- **[`tailwind.config.js`](front/tailwind.config.js:1):** Конфигурационный файл для Tailwind CSS.
- **[`tsconfig.json`](front/tsconfig.json) (и производные, например, [`tsconfig.app.json`](front/tsconfig.app.json), [`tsconfig.node.json`](front/tsconfig.node.json)):** Конфигурационные файлы для TypeScript, определяющие параметры компиляции.
- **[`package.json`](front/package.json):** Определяет зависимости проекта, скрипты сборки и запуска.

**Основные Компоненты (примеры):**
- **[`DashboardPage.tsx`](front/src/pages/DashboardPage.tsx:1)**: Основная страница приложения, вероятно, отображающая календарь ([`WeekView.tsx`](front/src/components/WeekView.tsx:1)) и события.
- **[`WeekView.tsx`](front/src/components/WeekView.tsx:1)**: Компонент для отображения событий на недельной сетке.
- **[`DayColumn.tsx`](front/src/components/DayColumn.tsx:1)**: Представляет колонку одного дня в недельном представлении, отображая задачи и заметки.
- **[`MiniEventCard.tsx`](front/src/components/MiniEventCard.tsx:1) / [`DetailedTaskCard.tsx`](front/src/components/DetailedTaskCard.tsx:1)**: Карточки для краткого и детального отображения задач/событий.
- **[`TopNavigator.tsx`](front/src/components/TopNavigator.tsx:1) / [`WeekNavigator.tsx`](front/src/components/WeekNavigator.tsx:1)**: Компоненты для навигации по приложению и по датам календаря.
- **[`UnifiedTaskFormModal.tsx`](front/src/components/UnifiedTaskFormModal.tsx:1)**: Модальное окно для создания и редактирования задач и других событий.
- **[`ChildCardManager.tsx`](front/src/components/ChildCardManager.tsx:1) / [`ExpenseCategoryManager.tsx`](front/src/components/ExpenseCategoryManager.tsx:1)**: Компоненты для управления связанными данными (например, карточки детей, категории расходов).
- **[`pages/Auth/LoginPage.tsx`](front/src/pages/Auth/LoginPage.tsx:1) / [`pages/Auth/RegistrationPage.tsx`](front/src/pages/Auth/RegistrationPage.tsx:1)**: Страницы для аутентификации и регистрации пользователей.
- **[`SettingsPage.tsx`](front/src/pages/SettingsPage.tsx:1)**: Страница для настроек пользователя и приложения.
- **[`PrivateRoute.tsx`](front/src/components/PrivateRoute.tsx:1)**: Компонент-обертка для защиты маршрутов, требующих аутентификации пользователя.