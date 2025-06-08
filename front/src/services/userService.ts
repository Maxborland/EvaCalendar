import api from './api';

export const updateEmailNotificationSettings = async (enabled: boolean) => {
  const response = await api.put('/users/me/settings/email-notifications', { enabled });
  return response.data;
};

export const getUserSettings = async () => {
  // Мы можем предположить, что эндпоинт /api/users/me вернет и эти настройки
  const response = await api.get('/users/me');
  return response.data;
};