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
      // Change password error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 font-['Inter'] bg-slate-900">
      <div className="w-full max-w-md">
        <div className="flex items-center mb-8">
          <div className="mr-4 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <span className="material-icons text-slate-900 text-2xl">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Смена пароля</h1>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="currentPassword" className="block text-slate-200 text-sm mb-2">
                Текущий пароль:
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-slate-700 border border-slate-600 text-slate-300 rounded-lg py-3 px-4 w-full text-base placeholder-slate-400"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="newPassword" className="block text-slate-200 text-sm mb-2">
                Новый пароль:
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                autoComplete="new-password"
                className="bg-slate-700 border border-slate-600 text-slate-300 rounded-lg py-3 px-4 w-full text-base placeholder-slate-400"
              />
            </div>

            <div className="mb-8"> {/* mb-8 для последнего поля перед кнопкой */}
              <label htmlFor="confirmNewPassword" className="block text-slate-200 text-sm mb-2">
                Подтвердите новый пароль:
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                autoComplete="new-password"
                className="bg-slate-700 border border-slate-600 text-slate-300 rounded-lg py-3 px-4 w-full text-base placeholder-slate-400"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2 mb-4 p-3 bg-red-900/50 rounded-md">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="text-green-500 text-sm mt-2 mb-4 p-3 bg-green-900/50 rounded-md">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg w-full text-center text-base transition-colors duration-300 ease-in-out hover:bg-blue-600"
            >
              {isLoading ? 'Сохранение...' : 'Сменить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;