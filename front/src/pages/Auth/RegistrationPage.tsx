import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Добавлен Link для навигации
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
    console.log('[RegPage] handleSubmit: Form submitted.');
    event.preventDefault();
    setServerError(null);
    if (validateForm()) {
      console.log('[RegPage] handleSubmit: Form is valid. Proceeding with registration.');
      try {
        console.log('[RegPage] handleSubmit: Calling api.post("/auth/register") with data:', { username, email }); // Пароль не логируем
        const registerResponse = await api.post('/auth/register', { // Исправлен URL
          username,
          email,
          password,
        });
        console.log('[RegPage] handleSubmit: Received response from /auth/register:', {
          status: registerResponse.status,
          data: registerResponse.data,
        });

        if (registerResponse.status === 201) {
          console.log('[RegPage] handleSubmit: Registration successful (status 201). Navigating to /login.');
          toast.success('Регистрация прошла успешно! Пожалуйста, войдите.');
          navigate('/login', { state: { message: 'Регистрация прошла успешно. Пожалуйста, войдите.' } });
        } else {
          console.warn('[RegPage] handleSubmit: Registration API returned non-201 status:', registerResponse.status, 'Data:', registerResponse.data);
          setServerError(registerResponse.data?.message || `Ошибка регистрации: статус ${registerResponse.status}`);
          toast.error(registerResponse.data?.message || `Ошибка регистрации: статус ${registerResponse.status}`);
        }
      } catch (error: any) {
        console.error('[RegPage] handleSubmit: Error during registration API call.', error);
        if (error.response && error.response.data && error.response.data.message) {
          console.error('[RegPage] handleSubmit: Server error message:', error.response.data.message);
          setServerError(error.response.data.message);
        } else if (error.message) {
          console.error('[RegPage] handleSubmit: Error message:', error.message);
          setServerError(error.message);
        } else {
          console.error('[RegPage] handleSubmit: Unknown error or connection failure.');
          setServerError('Не удалось подключиться к серверу или произошла неизвестная ошибка.');
        }
      }
    } else {
      console.log('[RegPage] handleSubmit: Form is invalid. Errors:', errors);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 font-['Inter'] bg-slate-900">
      <div className="flex flex-col items-center justify-center">
        <img className="max-w-24 mb-4" src="../../../icons/web/icon-512.png" alt="Login Icon" />
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Регистрация</h1>
        </div>
        <div className="bg-slate-800 rounded-2xl p-6">
          {serverError && (
            <div data-testid="server-error-message" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate data-testid="registration-form">
            <div className="mb-6">
              <label htmlFor="username" className="block text-slate-200 text-sm mb-2">
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
                className={`bg-slate-700 border ${errors.username ? 'border-red-500' : 'border-slate-600'} text-slate-300 rounded-lg py-3 px-4 w-full text-base placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.username && <p data-testid="username-input-error" className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-slate-200 text-sm mb-2">
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
                className={`bg-slate-700 border ${errors.email ? 'border-red-500' : 'border-slate-600'} text-slate-300 rounded-lg py-3 px-4 w-full text-base placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.email && <p data-testid="email-input-error" className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="mb-6">
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
                autoComplete="new-password"
                className={`bg-slate-700 border ${errors.password ? 'border-red-500' : 'border-slate-600'} text-slate-300 rounded-lg py-3 px-4 w-full text-base placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.password && <p data-testid="password-input-error" className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="mb-8"> {/* mb-8 для последнего поля перед кнопкой */}
              <label htmlFor="confirmPassword" className="block text-slate-200 text-sm mb-2">
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
                className={`bg-slate-700 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-600'} text-slate-300 rounded-lg py-3 px-4 w-full text-base placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.confirmPassword && <p data-testid="confirm-password-input-error" className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              data-testid="register-button"
              type="submit"
              className="bg-green-500 text-white font-semibold py-3 px-4 rounded-lg w-full text-center text-base transition-colors duration-300 ease-in-out hover:bg-green-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-medium text-green-400 no-underline hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;