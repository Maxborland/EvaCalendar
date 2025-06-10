import api from './api';

export const getNotificationSubscriptions = async () => {
  const response = await api.get('/notifications/subscriptions');
  return response.data;
};

export const subscribeToNotifications = async (subscription: PushSubscription) => {
  const response = await api.post('/notifications/subscribe', { subscription: subscription.toJSON() });
  return response.data;
};

export const unsubscribeFromNotifications = async (endpoint: string) => {
  const response = await api.post('/notifications/unsubscribe', { endpoint });
  return response.data;
};
export const sendTestNotification = async () => {
  const response = await api.post('/notifications/test-notification');
  return response.data;
};
export const getVapidPublicKey = async () => {
  const response = await api.get('/notifications/vapid-public-key');
  return response.data.publicKey;
};