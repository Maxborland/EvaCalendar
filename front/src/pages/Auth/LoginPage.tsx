import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
// import './AuthPage.css'; // Удален импорт

const LoginPage: React.FC = () => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!loginInput.trim()) {
      newErrors.loginInput = 'Email или имя пользователя обязательно';
    }
    // Проверка на формат email здесь больше не нужна,
    // так как поле принимает и имя пользователя.
    // else if (!/\S+@\S+\.\S+/.test(loginInput)) {
    //   newErrors.loginInput = 'Некорректный формат email';
    // }

    if (!password) {
      newErrors.password = 'Пароль обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);

    if (validateForm()) {
      try {
        const response = await api.post('/auth/login', {
          identifier: loginInput, // API теперь ожидает 'identifier'
          password: password,
        });

        if (response.status === 200 && response.data.token) {
          await login(response.data.token);
          console.log('Успешный вход через AuthContext');
          navigate('/');
        } else {
          setServerError(response.data.message || 'Произошла ошибка при входе.');
        }
      } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
          setServerError(error.response.data.message);
        } else if (error.message) {
          setServerError(error.message);
        } else {
          setServerError('Не удалось подключиться к серверу или произошла неизвестная ошибка.');
        }
        console.error('Ошибка входа:', error);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 font-['Inter'] bg-slate-900">
      <div className="flex flex-col items-center justify-center">
        <img className="max-w-24 mb-4" src="../../../icons/web/icon-512.png" alt="Login Icon" />
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Вход</h1>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6">
          {serverError && (
            <div data-testid="server-error-message" className="text-red-500 text-sm mb-4 text-center p-3 bg-red-900/30 rounded-md border border-red-700">
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
              className="bg-green-500 text-white font-semibold py-3 px-4 rounded-lg w-full text-center text-base transition-colors duration-300 ease-in-out hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading}
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