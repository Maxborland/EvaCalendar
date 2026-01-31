import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const { isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Имя пользователя должно быть не менее 3 символов';
    }

    if (!email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Некорректный формат email';
    }

    if (!password) {
      newErrors.password = 'Пароль обязателен';
    } else if (password.length < 8) {
      newErrors.password = 'Пароль должен быть не менее 8 символов';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);
    if (validateForm()) {
      try {
        const registerResponse = await api.post('/auth/register', {
          username,
          email,
          password,
        });

        if (registerResponse.status === 201) {
          toast.success('Регистрация прошла успешно! Пожалуйста, войдите.');
          navigate('/login', { state: { message: 'Регистрация прошла успешно. Пожалуйста, войдите.' } });
        } else {
          setServerError(registerResponse.data?.message || `Ошибка регистрации: статус ${registerResponse.status}`);
          toast.error(registerResponse.data?.message || `Ошибка регистрации: статус ${registerResponse.status}`);
        }
      } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
          setServerError(error.response.data.message);
        } else if (error.message) {
          setServerError(error.message);
        } else {
          setServerError('Не удалось подключиться к серверу или произошла неизвестная ошибка.');
        }
      }
    }
  };

  const inputClasses = (hasError: boolean) =>
    clsx(
      'rounded-lg py-3 px-4 w-full text-base',
      'bg-surface-elevated text-text-primary border',
      'focus:outline-none focus:ring-1 focus:ring-border-focus focus:border-transparent',
      hasError ? 'border-expense-primary' : 'border-border-subtle'
    );

  return (
    <div className="flex items-center justify-center min-h-screen px-4 font-['Inter'] bg-surface-app">
      <div className="flex flex-col items-center justify-center">
        <img className="max-w-24 mb-4" src="../../../icons/web/icon-512.png" alt="Login Icon" />
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Регистрация</h1>
        </div>
        <div className="rounded-2xl p-6 bg-surface-raised">
          {serverError && (
            <div data-testid="server-error-message" className="px-4 py-3 rounded relative mb-4 text-sm bg-expense-bg border border-expense-border text-expense-primary" role="alert">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate data-testid="registration-form">
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm mb-2 text-text-secondary">
                Имя пользователя
              </label>
              <input
                data-testid="username-input"
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                autoComplete="username"
                className={inputClasses(!!errors.username)}
              />
              {errors.username && <p data-testid="username-input-error" className="text-xs mt-1 text-expense-primary">{errors.username}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm mb-2 text-text-secondary">
                Email
              </label>
              <input
                data-testid="email-input"
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                autoComplete="email"
                className={inputClasses(!!errors.email)}
              />
              {errors.email && <p data-testid="email-input-error" className="text-xs mt-1 text-expense-primary">{errors.email}</p>}
            </div>

            <div className="mb-6">
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
                autoComplete="new-password"
                className={inputClasses(!!errors.password)}
              />
              {errors.password && <p data-testid="password-input-error" className="text-xs mt-1 text-expense-primary">{errors.password}</p>}
            </div>

            <div className="mb-8">
              <label htmlFor="confirmPassword" className="block text-sm mb-2 text-text-secondary">
                Подтвердите пароль
              </label>
              <input
                data-testid="confirm-password-input"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputClasses(!!errors.confirmPassword)}
              />
              {errors.confirmPassword && <p data-testid="confirm-password-input-error" className="text-xs mt-1 text-expense-primary">{errors.confirmPassword}</p>}
            </div>

            <button
              data-testid="register-button"
              type="submit"
              className="font-semibold py-3 px-4 rounded-lg w-full text-center text-base transition-colors duration-300 ease-in-out disabled:opacity-50 bg-btn-primary-bg hover:bg-btn-primary-hover text-btn-primary-text"
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-center text-sm mt-8 text-text-tertiary">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-medium no-underline hover:underline text-income-primary">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
