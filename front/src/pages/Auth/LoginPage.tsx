import clsx from 'clsx';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!loginInput.trim()) {
      newErrors.loginInput = 'Email или имя пользователя обязательно';
    }
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

      const { token, ...user } = response.data;
      login(user, token);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 font-['Inter'] bg-surface-app text-text-primary">
        Загрузка аутентификации...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const inputClasses = (hasError: boolean) =>
    clsx(
      'rounded-lg py-3 px-4 w-full text-base',
      'bg-surface-elevated text-text-primary border',
      'focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent',
      hasError ? 'border-expense-primary' : 'border-border-subtle'
    );

  return (
    <div className="flex items-center justify-center min-h-screen px-4 font-['Inter'] bg-surface-app">
      <div data-testid="debug-loginpage-info" className="hidden">
        {JSON.stringify({ isLoading, isAuthenticated, serverError })}
      </div>
      <div className="flex flex-col items-center justify-center">
        <img className="max-w-24 mb-4" src="../../../icons/web/icon-512.png" alt="Login Icon" />
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Вход</h1>
        </div>
        <div className="rounded-2xl p-6 w-full max-w-md bg-surface-raised">
          {successMessage && (
            <div data-testid="success-message" className="px-4 py-3 rounded relative mb-4 text-sm bg-income-bg border border-income-border text-income-primary" role="alert">
              {successMessage}
            </div>
          )}
          {serverError && (
            <div data-testid="server-error-message" className="text-sm mb-4 text-center p-3 rounded-md bg-expense-bg border border-expense-border text-expense-primary">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-6">
              <label htmlFor="loginInput" className="block text-sm mb-2 text-text-secondary">
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
                className={inputClasses(!!errors.loginInput)}
              />
              {errors.loginInput && <p data-testid="login-input-error" className="text-xs mt-1 text-expense-primary">{errors.loginInput}</p>}
            </div>

            <div className="mb-8">
              <label htmlFor="password" className="block text-sm mb-2 text-text-secondary">
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
                className={inputClasses(!!errors.password)}
              />
              {errors.password && <p data-testid="password-input-error" className="text-xs mt-1 text-expense-primary">{errors.password}</p>}
            </div>

            <button
              data-testid="login-button"
              type="submit"
              className="font-semibold py-3 px-4 rounded-lg w-full text-center text-base transition-colors duration-300 ease-in-out disabled:opacity-50 bg-btn-primary-bg hover:bg-btn-primary-hover text-btn-primary-text"
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <p className="text-center text-sm mt-8 text-text-tertiary">
            Нет аккаунта?{' '}
            <a href="/register" className="font-medium no-underline hover:underline text-income-primary">
              Зарегистрироваться
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
