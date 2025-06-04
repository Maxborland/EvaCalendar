import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import PrivateRoute from '../components/PrivateRoute';
import TopNavigator from '../components/TopNavigator';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../pages/Auth/LoginPage';
import RegistrationPage from '../pages/Auth/RegistrationPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import DashboardPage from '../pages/DashboardPage'; // Пример защищенной страницы
// Импортируем api (default export) и setAuthErrorHandler (named export)
// Эти импорты будут автоматически использовать мокированные версии благодаря vi.mock ниже
import api, { setAuthErrorHandler } from '../services/api';

// Мокируем модуль api ДО его импорта
vi.mock('../services/api', () => {
  // Объявляем мок-функцию ВНУТРИ фабрики, чтобы избежать проблем с hoisting
  const mockSetAuthErrorHandlerInsideFactory = vi.fn();
  return {
    __esModule: true, // Важно для модулей с default и именованными экспортами
    default: { // Это мок для axios инстанса (api.default)
      post: vi.fn(),
      get: vi.fn(),
      // Добавьте другие методы, если они используются (put, delete и т.д.)
    },
    // Важно: ключ должен совпадать с именем экспортируемой функции
    setAuthErrorHandler: mockSetAuthErrorHandlerInsideFactory,
  };
});

// Вспомогательная функция для рендеринга с провайдерами
const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          {/* Обернем защищенные маршруты в общий layout с TopNavigator */}
          <Route path="/" element={
            <div>
              <TopNavigator title="Test Page" />
              <Outlet />
            </div>
          }>
            <Route index element={<h1>Home Page</h1>} /> {/* Главная страница, если нужна */}
            <Route path="dashboard" element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } />
            <Route path="change-password" element={
              <PrivateRoute>
                <ChangePasswordPage />
              </PrivateRoute>
            } />
            {/* Другие публичные или защищенные маршруты, которые должны быть с TopNavigator */}
          </Route>
          {/* Маршрут для тестирования PrivateRoute напрямую, если он не должен иметь TopNavigator */}
          <Route path="/protected-explicit" element={
            <PrivateRoute>
              <h1>Explicitly Protected Page</h1>
            </PrivateRoute>
          } />
          {/* Если какой-то защищенный маршрут НЕ должен иметь TopNavigator, его нужно определить отдельно, как /protected-explicit */}
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};


// Вспомогательный компонент для проверки AuthContext
const AuthStateChecker = () => {
  const { isAuthenticated, user, token } = useAuth();
  return (
    <div>
      <span data-testid="auth-isAuthenticated">{isAuthenticated.toString()}</span>
      <span data-testid="auth-user">{JSON.stringify(user)}</span>
      <span data-testid="auth-token">{token}</span>
    </div>
  );
};

// Обертка для тестирования компонентов, которым нужен AuthContext и маршрутизация
const renderWithAuth = (ui: React.ReactElement, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={
            <>
              {ui}
              <AuthStateChecker /> {/* Для проверки состояния AuthContext */}
            </>
          } />
          {/* Дополнительные маршруты для навигации */}
          <Route path="/login" element={<><h1>Login Page Redirect</h1><AuthStateChecker /></>} />
          <Route path="/dashboard" element={<><h1>Dashboard Page Redirect</h1><AuthStateChecker /></>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};


describe('Auth Workflow Tests', () => {
  beforeEach(() => {
    // Очистка localStorage
    localStorage.clear();
    // Очищаем состояние всех моков (счетчики вызовов, реализации и т.д.)
    // Сам мок, определенный через vi.mock на уровне модуля, остается.
    vi.clearAllMocks();

    // Устанавливаем дефолтное поведение для api.get('/api/users/me')
    // чтобы checkAuthStatus не аутентифицировал пользователя случайно.
    // В тестах, где нужна успешная начальная аутентификация, этот мок будет переопределен.
    (api.get as Mock).mockImplementation(async (url: string) => {
      if (url === '/api/users/me') {
        return Promise.reject({ response: { status: 401, data: { message: 'No active session' } } });
      }
      // Для других GET запросов, если они есть и не замоканы индивидуально
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // 1. Регистрация пользователя
  describe('User Registration', () => {
    it('should register a new user successfully and log them in', async () => {
      // Данные пользователя, которые мы ожидаем после регистрации и логина
      const mockFinalUserData = { id: '1', username: 'test@example.com', email: 'test@example.com' };
      const mockToken = 'mock-jwt-token';

      // Мок для /api/auth/register (первый вызов POST)
      // Предполагаем, что API регистрации возвращает что-то простое, например, только сообщение или статус,
      // а не сразу данные пользователя и токен, так как логин идет отдельным шагом.
      // Если API регистрации сразу возвращает юзера и токен, то второй мок для /auth/login не нужен.
      // Судя по RegistrationPage.tsx, после успешной регистрации (201) идет отдельный запрос на /auth/login.
      (api.post as Mock).mockResolvedValueOnce({
        status: 201, // Успешная регистрация
        data: { message: 'User registered' } // Пример ответа
      });

      // Мок для /auth/login (второй вызов POST, автоматический логин после регистрации)
      (api.post as Mock).mockResolvedValueOnce({
        status: 200,
        data: { user: mockFinalUserData, token: mockToken },
      });

      // Мок для /api/users/me (вызывается AuthContext.login для получения данных пользователя)
      (api.get as Mock).mockResolvedValueOnce({ data: mockFinalUserData });


      renderWithAuth(<RegistrationPage />, { route: '/register' });

      // Используем getByLabelText и корректируем ввод данных
      await userEvent.type(screen.getByLabelText(/Имя пользователя \(или Email\):/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^Пароль:$/i), 'password123'); // Более точный селектор
      await userEvent.type(screen.getByLabelText(/Подтвердите пароль:/i), 'password123');

      fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

      // Проверяем первый вызов api.post (регистрация)
      await waitFor(() => {
        // Убедимся, что это первый вызов и с правильными данными
        expect(api.post).toHaveBeenNthCalledWith(1, '/api/auth/register', {
          username: 'test@example.com', // Компонент RegistrationPage отправляет username
          password: 'password123',
        });
      });

      // Проверяем второй вызов api.post (логин после регистрации)
      // Этот вызов делается внутри RegistrationPage.tsx
      await waitFor(() => {
        expect(api.post).toHaveBeenNthCalledWith(2, '/auth/login', { // Путь из RegistrationPage.tsx
          email: 'test@example.com', // Компонент RegistrationPage отправляет email для логина
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(mockToken);
      });

      // Проверка состояния AuthContext
      await waitFor(() => {
        expect(screen.getByTestId('auth-isAuthenticated').textContent).toBe('true');
        // Ожидаем mockFinalUserData, так как это данные, которые должен получить AuthContext
        expect(screen.getByTestId('auth-user').textContent).toBe(JSON.stringify(mockFinalUserData));
        expect(screen.getByTestId('auth-token').textContent).toBe(mockToken);
      });

      // Проверка перенаправления (MemoryRouter должен обновить текущий путь)
      // Для этого в renderWithAuth мы добавили тестовые страницы для редиректа
      await waitFor(() => {
        // Ожидаем, что пользователь будет перенаправлен на /dashboard
        // В нашем `renderWithAuth` это будет `Dashboard Page Redirect`
        expect(screen.getByText('Dashboard Page Redirect')).toBeInTheDocument();
      });
    });

    it('should display an error message if registration fails (e.g., email exists)', async () => {
      const errorMessage = 'Пользователь с таким email уже существует';
      (api.post as Mock).mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      });

      renderWithAuth(<RegistrationPage />, { route: '/register' });

      // Используем getByLabelText и корректируем ввод данных
      await userEvent.type(screen.getByLabelText(/Имя пользователя \(или Email\):/i), 'taken@example.com');
      await userEvent.type(screen.getByLabelText(/^Пароль:$/i), 'password123'); // Более точный селектор
      await userEvent.type(screen.getByLabelText(/Подтвердите пароль:/i), 'password123');

      fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

      await waitFor(() => {
        // Компонент RegistrationPage отправляет 'username' и 'password'
        // 'username' в данном случае это email 'taken@example.com'
        // Этот вызов должен быть первым и единственным, так как регистрация фейлится
        expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
          username: 'taken@example.com', // Должно быть username согласно RegistrationPage.tsx
          password: 'password123',
        });
      });

      await waitFor(() => {
        // Ищем элемент, который отображает сообщение об ошибке.
        // Это может быть div, span, alert и т.д. в зависимости от реализации компонента.
        // Предположим, что ошибка отображается в элементе с ролью 'alert' или просто текстом.
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Убедимся, что пользователь не аутентифицирован и токен не сохранен
      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByTestId('auth-isAuthenticated').textContent).toBe('false');
    });

    it('should display client-side validation errors for invalid data (e.g., passwords do not match)', async () => {
      renderWithAuth(<RegistrationPage />, { route: '/register' });

      // Используем getByLabelText и корректируем ввод данных
      await userEvent.type(screen.getByLabelText(/Имя пользователя \(или Email\):/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^Пароль:$/i), 'password123'); // Более точный селектор
      await userEvent.type(screen.getByLabelText(/Подтвердите пароль:/i), 'password456'); // Несовпадающий пароль

      fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

      // Ожидаем появления сообщения об ошибке валидации.
      // Точный текст и способ отображения зависят от реализации компонента.
      // Предположим, что есть текст "Пароли не совпадают".
      // Если используется HTML5 валидация, то можно проверять :invalid псевдокласс или validationMessage на input.
      // Для кастомной валидации, ищем элемент с текстом ошибки.
      await waitFor(() => {
        // Пример: ищем текст ошибки. Адаптируйте селектор, если необходимо.
        expect(screen.getByText(/пароли не совпадают/i)).toBeInTheDocument();
      });

      // Убедимся, что API не вызывался
      expect(api.post).not.toHaveBeenCalled();

      // Убедимся, что пользователь не аутентифицирован и токен не сохранен
      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByTestId('auth-isAuthenticated').textContent).toBe('false');
    });
  });

  // 2. Вход пользователя
  describe('User Login', () => {
    it('should log in an existing user successfully', async () => {
      const mockUserData = { id: '1', name: 'Test User', email: 'test@example.com' };
      const mockToken = 'mock-jwt-token-login';

      (api.post as Mock).mockResolvedValueOnce({
        data: { user: mockUserData, token: mockToken },
      });
      // Предполагаем, что после входа происходит запрос /users/me
      (api.get as Mock).mockResolvedValueOnce({ data: mockUserData });

      renderWithAuth(<LoginPage />, { route: '/login' });

      // Используем getByLabelText
      await userEvent.type(screen.getByLabelText(/Имя пользователя \(или Email\):/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^Пароль:$/i), 'password123'); // Более точный селектор

      fireEvent.click(screen.getByRole('button', { name: /войти/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(mockToken);
      });

      // Проверка состояния AuthContext
      await waitFor(() => {
        expect(screen.getByTestId('auth-isAuthenticated').textContent).toBe('true');
        expect(screen.getByTestId('auth-user').textContent).toBe(JSON.stringify(mockUserData));
        expect(screen.getByTestId('auth-token').textContent).toBe(mockToken);
      });

      // Проверка перенаправления
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page Redirect')).toBeInTheDocument();
      });
    });

    it('should display an error message for invalid credentials', async () => {
      const errorMessage = 'Неверный email или пароль';
      (api.post as Mock).mockRejectedValueOnce({
        response: { status: 401, data: { message: errorMessage } },
      });

      renderWithAuth(<LoginPage />, { route: '/login' });

      // Используем getByLabelText
      await userEvent.type(screen.getByLabelText(/Имя пользователя \(или Email\):/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^Пароль:$/i), 'wrongpassword'); // Более точный селектор

      fireEvent.click(screen.getByRole('button', { name: /войти/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByTestId('auth-isAuthenticated').textContent).toBe('false');
    });
  });

  // 3. Доступ к защищенным роутам
  describe('Protected Route Access', () => {
    it('should redirect unauthenticated user to login page when accessing a protected route', async () => {
      // Используем renderWithProviders, так как он содержит полную настройку маршрутов,
      // включая PrivateRoute, защищающий /dashboard
      renderWithProviders(<div>App Content</div>, { route: '/dashboard' });

      // Ожидаем, что неаутентифицированный пользователь будет перенаправлен на /login.
      // В нашей конфигурации renderWithProviders, LoginPage будет отрендерен.
      // Мы можем проверить наличие элемента, специфичного для LoginPage.
      // Например, поле для ввода email.
      await waitFor(() => {
        // Используем getByLabelText, так как LoginPage использует label
        expect(screen.getByLabelText(/Имя пользователя \(или Email\):/i)).toBeInTheDocument();
      });

      // Дополнительно можно проверить, что текущий путь изменился на /login.
      // Однако, MemoryRouter не обновляет window.location.pathname напрямую в тестах.
      // Проверка наличия контента страницы логина является более надежной.
      // Если бы мы хотели проверить URL, нам пришлось бы использовать более сложную настройку
      // или кастомный компонент для отслеживания текущего местоположения в MemoryRouter.
      // В данном случае, проверка элемента со страницы логина достаточна.
      await waitFor(() => {
        // Проверяем, что мы на странице логина, найдя, например, кнопку "Войти"
        expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
      });
    });

    it('should allow authenticated user to access protected route', async () => {
      // mockUserData должен содержать все поля, которые ожидает AuthContext.setUser
      const mockUserData = { id: '1', email: 'test@example.com', name: 'Test User' };
      const mockToken = 'mock-jwt-token-authed';

      // Мок для /auth/login (вызывается из LoginPage)
      // LoginPage ожидает ответа { data: { user: {...}, token: ... } }
      (api.post as Mock).mockResolvedValueOnce({
        status: 200,
        data: { user: { id: '1', email: 'test@example.com' }, token: mockToken },
      });

      // Моки для /api/users/me
      // Первый вызов из AuthContext.login после установки токена
      // Второй вызов при проверке токена на /dashboard (через PrivateRoute -> AuthProvider.checkAuthStatus)
      (api.get as Mock)
        .mockResolvedValueOnce({ data: mockUserData }) // Для AuthContext.login
        .mockResolvedValueOnce({ data: mockUserData }); // Для проверки на защищенном роуте


      // Сначала логинимся
      // Используем renderWithProviders, так как он имеет полную настройку маршрутов
      const { unmount } = renderWithProviders(<LoginPage />, { route: '/login' });

      // Используем getByLabelText для LoginPage
      await userEvent.type(screen.getByLabelText(/Имя пользователя \(или Email\):/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^Пароль:$/i), 'password123'); // Более точный селектор
      fireEvent.click(screen.getByRole('button', { name: /войти/i }));

      // Сначала убедимся, что логин API был вызван
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Затем убедимся, что токен установлен в localStorage
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(mockToken);
      });

      // И что /api/users/me был вызван (первый раз, из AuthContext.login)
      await waitFor(() => {
        // Проверяем первый вызов /api/users/me
        expect(api.get).toHaveBeenNthCalledWith(1, '/api/users/me');
      });

      // Важно: После логина и установки токена, AuthProvider может асинхронно обновить состояние.
      // Чтобы следующий рендер (или навигация) корректно использовал аутентифицированное состояние,
      // нужно дождаться этого обновления.
      // Проверим, что AuthContext обновился
      // Для этого можно временно отрендерить AuthStateChecker или положиться на то,
      // что PrivateRoute корректно отработает после обновления контекста.

      // Демонтируем LoginPage, чтобы избежать конфликтов элементов при следующем рендере
      unmount();

      // Теперь пытаемся получить доступ к защищенному роуту /dashboard
      // renderWithProviders будет использовать тот же AuthProvider, который уже содержит токен
      renderWithProviders(<div>App Content</div>, { route: '/dashboard' });

      // Ожидаем, что DashboardPage будет отрендерен
      // Проверяем наличие элемента, специфичного для DashboardPage
      await waitFor(() => {
        // DashboardPage в тестах рендерит "Добро пожаловать на дашборд!"
        expect(screen.getByText(/Добро пожаловать на дашборд!/i)).toBeInTheDocument();
      });
    });
  });

  // 4. Выход пользователя
  describe('User Logout', () => {
    it('should log out an authenticated user successfully', async () => {
      const mockUserData = { id: '1', name: 'Test User', email: 'test@example.com' };
      const mockToken = 'mock-jwt-token-logout';

      // 1. Устанавливаем токен в localStorage, чтобы симулировать залогиненного пользователя
      localStorage.setItem('token', mockToken);

      // 2. Мокируем /users/me, который будет вызван AuthProvider при инициализации с токеном
      (api.get as Mock).mockResolvedValueOnce({ data: mockUserData });

      // 3. Мокируем успешный ответ для /api/auth/logout
      (api.post as Mock).mockResolvedValueOnce({ status: 200, data: { message: 'Logged out' } });

      // Рендерим компонент, который содержит TopNavigator.
      // Используем renderWithProviders, так как он настроен с TopNavigator и маршрутами.
      // Переходим на /dashboard, чтобы TopNavigator был видим и пользователь считался аутентифицированным.
      const { unmount } = renderWithProviders(<div>App Content</div>, { route: '/dashboard' });

      // Убедимся, что пользователь аутентифицирован и DashboardPage отображается
      await waitFor(() => {
        // DashboardPage в тестах рендерит "Добро пожаловать на дашборд!"
        expect(screen.getByText(/Добро пожаловать на дашборд!/i)).toBeInTheDocument();
      });

      // Находим кнопку "Выход" в TopNavigator и кликаем по ней
      // Судя по выводу ошибки, доступное имя кнопки "logout"
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      // Проверяем вызов API /api/auth/logout
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/auth/logout');
      });

      // Проверяем, что токен удален из localStorage
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
      });

      // Демонтируем текущий рендер
      unmount();

      // Проверяем, что пользователь перенаправлен на страницу входа.
      // Для этого снова рендерим с начальным маршрутом, который должен привести к /login
      // если пользователь не аутентифицирован.
      renderWithProviders(<div>App Content</div>, { route: '/dashboard' }); // Попытка доступа к защищенному роуту

      await waitFor(() => {
        // Ожидаем, что пользователь будет перенаправлен на /login
        // Используем getByLabelText для LoginPage
        expect(screen.getByLabelText(/Имя пользователя \(или Email\):/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
      });

      // Дополнительная проверка состояния AuthContext через AuthStateChecker, если бы он был отрендерен отдельно
      // const { rerender } = render(<AuthProvider><AuthStateChecker/></AuthProvider>);
      // rerender(<AuthProvider><AuthStateChecker/></AuthProvider>); // Перерендериваем для обновления
      // await waitFor(() => {
      //   expect(screen.getByTestId('auth-isAuthenticated').textContent).toBe('false');
      //   expect(screen.getByTestId('auth-user').textContent).toBe('null');
      //   expect(screen.getByTestId('auth-token').textContent).toBe('');
      // });
    });
  });

  // 5. Смена пароля
  describe('Change Password', () => {
    it('should change password successfully for an authenticated user', async () => {
      const mockToken = 'mock-jwt-token-changepw';
      const mockUserData = { id: '1', name: 'Test User', email: 'test@example.com' };

      // 1. Симулируем залогиненного пользователя
      localStorage.setItem('token', mockToken);
      (api.get as Mock).mockResolvedValueOnce({ data: mockUserData }); // для AuthProvider

      // 2. Мокируем успешный ответ для /api/users/me/change-password
      (api.post as Mock).mockResolvedValueOnce({
        status: 200,
        data: { message: 'Пароль успешно изменен' },
      });

      // Рендерим страницу смены пароля. Используем renderWithProviders,
      // так как ChangePasswordPage обернута в PrivateRoute.
      renderWithProviders(<div>App Content</div>, { route: '/change-password' });

      // Убедимся, что страница смены пароля загрузилась (проверка на PrivateRoute)
      // и используем getByLabelText
      await waitFor(() => {
        expect(screen.getByLabelText(/^Текущий пароль:$/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/^Текущий пароль:$/i), 'oldPassword123');
      await userEvent.type(screen.getByLabelText(/^Новый пароль:$/i), 'newPassword456');
      await userEvent.type(screen.getByLabelText(/^Подтвердите новый пароль:$/i), 'newPassword456');

      // Кнопка в ChangePasswordPage имеет текст "Сменить пароль"
      fireEvent.click(screen.getByRole('button', { name: /сменить пароль/i }));

      // Проверяем вызов API
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/users/me/change-password',
          {
            currentPassword: 'oldPassword123',
            newPassword: 'newPassword456',
          },
          // Проверяем, что заголовки содержат Authorization
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer ${mockToken}`, // mockToken из этого теста
            }),
          })
        );
      });

      // Проверяем отображение сообщения об успехе
      await waitFor(() => {
        expect(screen.getByText(/пароль успешно изменен/i)).toBeInTheDocument();
      });

      // В этом сценарии пользователь остается залогиненным, токен не должен меняться или удаляться
      expect(localStorage.getItem('token')).toBe(mockToken);
    });

    it('should display an error message if current password is incorrect', async () => {
      const mockToken = 'mock-jwt-token-changepw-fail';
      const mockUserData = { id: '1', name: 'Test User', email: 'test@example.com' };
      const errorMessage = 'Неверный текущий пароль';

      // 1. Симулируем залогиненного пользователя
      localStorage.setItem('token', mockToken);
      (api.get as Mock).mockResolvedValueOnce({ data: mockUserData }); // для AuthProvider

      // 2. Мокируем ошибку для /api/users/me/change-password
      (api.post as Mock).mockRejectedValueOnce({
        response: { status: 400, data: { message: errorMessage } },
      });

      renderWithProviders(<div>App Content</div>, { route: '/change-password' });

      // Используем getByLabelText
      await waitFor(() => {
        expect(screen.getByLabelText(/^Текущий пароль:$/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/^Текущий пароль:$/i), 'wrongOldPassword');
      await userEvent.type(screen.getByLabelText(/^Новый пароль:$/i), 'newPassword456');
      await userEvent.type(screen.getByLabelText(/^Подтвердите новый пароль:$/i), 'newPassword456');

      // Кнопка в ChangePasswordPage имеет текст "Сменить пароль"
      fireEvent.click(screen.getByRole('button', { name: /сменить пароль/i }));

      // Проверяем вызов API
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/users/me/change-password',
          {
            currentPassword: 'wrongOldPassword',
            newPassword: 'newPassword456',
          },
          // Проверяем, что заголовки содержат Authorization
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer ${mockToken}`, // mockToken из этого теста (mock-jwt-token-changepw-fail)
            }),
          })
        );
      });

      // Проверяем отображение сообщения об ошибке
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Токен должен остаться, пользователь все еще залогинен
      expect(localStorage.getItem('token')).toBe(mockToken);
    });
  });

  // 6. Обработка истекшего/невалидного токена
  describe('Token Expiry / Invalidation', () => {
    it('should log out user and redirect to login if API returns 401 for a protected resource', async () => {
      const mockToken = 'mock-invalid-or-expired-token';

      // 1. Симулируем наличие невалидного токена в localStorage
      localStorage.setItem('token', mockToken);

      // 2. Мокируем api.get('/api/users/me') (или другой защищенный ресурс,
      //    который AuthProvider пытается загрузить при наличии токена) так,
      //    чтобы он вернул ошибку 401.
      //    Это должно запустить логику в interceptor-е ответа в api.ts,
      //    которая, в свою очередь, вызовет logout в AuthContext.
      //    Важно, чтобы setAuthErrorHandler был вызван с функцией, которая делает logout.
      //    В AuthProvider это делается так: setAuthErrorHandler(logout);
      //    Мы можем симулировать это, сохранив обработчик и вызвав его.

      let capturedLogoutHandler: () => void = () => {};
      // Теперь setAuthErrorHandler - это уже мокированная функция, импортированная вверху файла.
      // Мы можем использовать ее напрямую.
      (setAuthErrorHandler as Mock).mockImplementation((handler: () => void) => {
        capturedLogoutHandler = handler;
      });

      (api.get as Mock).mockImplementation(async (url: string) => {
        if (url === '/api/users/me') {
          // Симулируем, что обработчик ошибки 401 был вызван
          // Это должно привести к вызову logout из AuthContext
          // Так как logout асинхронный, добавим await, хотя capturedLogoutHandler сам по себе может быть синхронным
          await capturedLogoutHandler(); // Вызываем сохраненный обработчик (logout из AuthContext)
          throw { // Затем выбрасываем ошибку, как это сделал бы axios
            response: { status: 401, data: { message: 'Unauthorized' } },
            isAxiosError: true,
          };
        }
        // Для других GET запросов (если они есть в этом тесте)
        return Promise.resolve({ data: {} });
      });


      // Мокируем /api/auth/logout, который будет вызван AuthContext.logout()
      // Этот мок должен быть здесь, так как logout() в AuthContext его вызывает
      (api.post as Mock).mockResolvedValueOnce({ status: 200, data: { message: 'Logged out' } });


      // Рендерим приложение, пытаясь получить доступ к защищенному маршруту.
      // AuthProvider попытается проверить токен (вызвав /users/me), получит 401,
      // interceptor обработает это, вызовет logout, и PrivateRoute перенаправит на /login.
      renderWithProviders(<div>App Content</div>, { route: '/dashboard' });

      // Ожидаем, что пользователь будет перенаправлен на /login
      await waitFor(() => {
        // Используем getByLabelText для LoginPage
        expect(screen.getByLabelText(/Имя пользователя \(или Email\):/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
      });

      // Убедимся, что токен удален из localStorage
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
      });

      // Проверим, что logout был вызван (если AuthContext вызывает /api/auth/logout)
      // Если logout просто очищает локальное состояние, то эта проверка может быть не нужна,
      // но если он делает API вызов, то это важно.
      // В задаче указано мокировать /api/auth/logout, так что проверим его вызов.
      await waitFor(() => {
         expect(api.post).toHaveBeenCalledWith('/api/auth/logout');
      });

      // Дополнительно можно проверить состояние AuthContext, если отрендерить AuthStateChecker
      // const { getByTestId } = render(<AuthProvider><AuthStateChecker /></AuthProvider>);
      // await waitFor(() => {
      //   expect(getByTestId('auth-isAuthenticated').textContent).toBe('false');
      // });
    });
  });
});