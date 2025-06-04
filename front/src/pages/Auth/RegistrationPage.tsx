import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // Импортируем useAuth
import api from '../../services/api'; // Импортируем настроенный axios instance
import './AuthPage.css'; // Общий файл стилей для страниц аутентификации

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth(); // Используем login и isLoading из AuthContext
  const [username, setUsername] = useState('');
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
    // Можно добавить проверку на email, если это требуется:
    // else if (!/\S+@\S+\.\S+/.test(username)) {
    //   newErrors.username = 'Некорректный формат email';
    // }

    if (!password) {
      newErrors.password = 'Пароль обязателен';
    } else if (password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null); // Сброс предыдущей серверной ошибки
    if (validateForm()) {
      try {
        // Отправляем данные на эндпоинт /api/auth/register
        // Предполагается, что API_URL в api.ts уже настроен на http://localhost:3001
        // и /api/auth/register будет корректно разрешен как http://localhost:3001/api/auth/register
        // Шаг 1: Регистрация пользователя
        const registerResponse = await api.post('/api/auth/register', {
          username, // или email, если бэкенд ожидает email. Убедитесь, что это соответствует вашему API.
          password,
        });

        if (registerResponse.status === 201) {
          toast.info('Регистрация успешна. Выполняется вход...');

          // Шаг 2: Автоматический вход пользователя
          // Предполагаем, что API входа ожидает 'email', а не 'username'.
          // Если API регистрации возвращает email или username, используйте его.
          // В данном примере используется 'username' как 'email' для входа, что может потребовать корректировки.
          const loginResponse = await api.post('/auth/login', {
            email: username, // Убедитесь, что это поле соответствует ожиданиям API входа
            password: password,
          });

          if (loginResponse.status === 200 && loginResponse.data.token) {
            await login(loginResponse.data.token); // Используем login из AuthContext
            toast.success('Вход выполнен успешно!');
            navigate('/dashboard'); // Перенаправление на дашборд
          } else {
            setServerError(loginResponse.data.message || 'Не удалось автоматически войти после регистрации.');
            toast.warn('Регистрация прошла, но не удалось автоматически войти. Пожалуйста, войдите вручную.');
            navigate('/login'); // Перенаправить на страницу входа, если авто-логин не удался
          }
        } else {
          setServerError(registerResponse.data.message || 'Произошла неизвестная ошибка при регистрации.');
        }
      } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
          setServerError(error.response.data.message);
        } else if (error.message) {
          setServerError(error.message);
        } else {
          setServerError('Не удалось подключиться к серверу или произошла неизвестная ошибка.');
        }
        console.error('Ошибка регистрации или входа:', error);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <h2>Регистрация</h2>
        {serverError && <div className="server-error-message">{serverError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Имя пользователя (или Email):</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={errors.username ? 'input-error' : ''}
            />
            {errors.username && <p className="error-message">{errors.username}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <p className="error-message">{errors.password}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-switch">
          Уже есть аккаунт? <a href="/login">Войти</a>
        </p>
      </div>
    </div>
  );
};

export default RegistrationPage;