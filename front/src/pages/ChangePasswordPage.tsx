import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ChangePasswordPage: React.FC = () => {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Все поля обязательны для заполнения.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Новый пароль и подтверждение не совпадают.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Новый пароль должен содержать не менее 8 символов.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post(
        '/api/users/me/change-password',
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage('Пароль успешно изменен.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.status === 401) {
        setError('Неверный текущий пароль или проблема с аутентификацией.');
      } else if (err.response && err.response.status === 422) {
        setError('Новый пароль не соответствует требованиям безопасности (например, слишком простой).');
      }
      else {
        setError('Произошла ошибка при смене пароля.');
      }
      console.error('Change password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h2>Смена пароля</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="currentPassword">Текущий пароль:</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="newPassword">Новый пароль:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="confirmNewPassword">Подтвердите новый пароль:</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
        <button type="submit" disabled={isLoading} style={{ padding: '10px 15px' }}>
          {isLoading ? 'Сохранение...' : 'Сменить пароль'}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;