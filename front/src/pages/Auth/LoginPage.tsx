import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth(); // Добавлено isAuthenticated

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Очищаем state из location, чтобы сообщение не показывалось снова при обновлении страницы или возврате
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!loginInput.trim()) {
      newErrors.loginInput = 'Email или имя пользователя обязательно';
    }
    // Проверка на формат email здесь больше не нужна,
    // так как поле принимает и имя пользователя.

    if (!password) {
      newErrors.password = 'Пароль обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        identifier: loginInput,
        password: password,
      });

      // Бэкенд возвращает { token, userId, username, email, role }
      // Мы можем собрать объект пользователя из ответа
      const { token, ...user } = response.data;

      // Вызываем обновленный метод login из контекста
      login(user, token);

      // Навигация больше не нужна здесь, так как
      // PublicOnlyRoute автоматически обработает изменение
      // состояния isAuthenticated и выполнит редирект.
      // navigate('/');

    } catch (error: any) {
      let specificMessage = '';
      if (error.response && error.response.data && typeof error.response.data.message === 'string' && error.response.data.message.trim() !== '') {
        specificMessage = error.response.data.message;
      } else if (error.response && error.response.status === 401) {
        specificMessage = 'Неверный логин или пароль.';
      } else if (typeof error.message === 'string' && error.message.trim() !== '') {
        specificMessage = error.message;
      } else {
        specificMessage = 'Произошла ошибка при входе. Пожалуйста, попробуйте снова.';
      }
      setServerError(specificMessage);
    }
  };

  // Если isLoading true, показываем заглушку, чтобы избежать моргания LoginPage,
  // пока AuthContext определяет состояние аутентификации.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 font-['Inter'] bg-slate-900 text-slate-100">
        Загрузка аутентификации...
      </div>
    );
  }

  // Если пользователь аутентифицирован (и isLoading уже false), перенаправляем на главную
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }


  return (
    <div className="flex items-center justify-center min-h-screen px-4 font-['Inter'] bg-slate-900">
      <div data-testid="debug-loginpage-info" style={{ display: 'none' }}>
        {JSON.stringify({ isLoading, isAuthenticated, serverError })}
      </div>
      <div className="flex flex-col items-center justify-center">
        <img className="max-w-24 mb-4" src="../../../icons/web/icon-512.png" alt="Login Icon" />
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Вход</h1>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md"> {/* Добавил w-full max-w-md для ограничения ширины */}
          {successMessage && (
            <div data-testid="success-message" className="success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
              {successMessage}
            </div>
          )}
          {serverError && (
            <div data-testid="server-error-message" className="text-red-700 text-sm mb-4 text-center p-3 bg-red-100 rounded-md border border-red-400">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-6">
              <label htmlFor="loginInput" className="block text-slate-200 text-sm mb-2">
                Email или имя пользователя
              </label>
              <input
                data-testid="login-input"
                type="text"
                id="loginInput"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Введите email или имя пользователя"
                autoComplete="username"
                className={`bg-slate-700 border ${errors.loginInput ? 'border-red-500' : 'border-slate-600'} text-slate-300 rounded-lg py-3 px-4 w-full text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.loginInput && <p data-testid="login-input-error" className="text-red-500 text-xs mt-1">{errors.loginInput}</p>}
            </div>

            <div className="mb-8"> {/* mb-8 для последнего поля перед кнопкой */}
              <label htmlFor="password" className="block text-slate-200 text-sm mb-2">
                Пароль
              </label>
              <input
                data-testid="password-input"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`bg-slate-700 border ${errors.password ? 'border-red-500' : 'border-slate-600'} text-slate-300 rounded-lg py-3 px-4 w-full text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {errors.password && <p data-testid="password-input-error" className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              data-testid="login-button"
              type="submit"
              className="bg-green-500 text-white font-semibold py-3 px-4 rounded-lg w-full text-center text-base transition-colors duration-300 ease-in-out hover:bg-green-600 disabled:opacity-50"
              disabled={isLoading} // Здесь isLoading из useAuth() все еще актуален для кнопки, даже если выше есть проверка
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-8">
            Нет аккаунта?{' '}
            <a href="/register" className="font-medium text-green-400 no-underline hover:underline">
              Зарегистрироваться
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;