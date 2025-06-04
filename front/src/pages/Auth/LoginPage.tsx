import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Импортируем useAuth
import api from '../../services/api'; // Импортируем наш API клиент
import './AuthPage.css'; // Общий файл стилей для страниц аутентификации

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState(''); // Это будет использоваться как email для API
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const { login, isLoading } = useAuth(); // Используем login и isLoading из AuthContext
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    }
    // Можно добавить проверку на email, если это требуется:
    // else if (!/\S+@\S+\.\S+/.test(username)) {
    //   newErrors.username = 'Некорректный формат email';
    // }

    if (!password) {
      newErrors.password = 'Пароль обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null); // Сброс предыдущей серверной ошибки

    if (validateForm()) {
      try {
        const response = await api.post('/api/auth/login', { // Исправлен URL
          email: username, // API ожидает 'email'
          password: password,
        });

        if (response.status === 200 && response.data.token) {
          await login(response.data.token); // Используем login из AuthContext
          console.log('Успешный вход через AuthContext');
          navigate('/dashboard'); // Перенаправление на дашборд
        } else {
          // Это условие может не понадобиться, если interceptor обрабатывает все не-200 ответы
          // или если login обрабатывает ошибки и выбрасывает их
          setServerError(response.data.message || 'Произошла ошибка при входе.');
        }
      } catch (error: any) {
        // Ошибки от login или от api.post
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

  // Блок if (isAuthenticated) удален, так как управление этим состоянием теперь глобальное

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <h2>Вход</h2>
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
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="auth-switch">
          Нет аккаунта? <a href="/register">Зарегистрироваться</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;