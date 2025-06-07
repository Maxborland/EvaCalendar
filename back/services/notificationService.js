require('dotenv').config({ path: './back/.env' });
const webpush = require('web-push');
const db = require('../db.cjs');

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'mailto:admin@maxborland.space',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const deleteSubscriptionByEndpoint = async (endpoint) => {
  try {
    await db('notification_subscriptions').where('endpoint', endpoint).del();
    console.log('Недействительная подписка удалена:', endpoint);
  } catch (dbError) {
    console.error('Ошибка при удалении подписки из БД:', dbError);
  }
};

const sendNotification = async (subscriptionData, payload) => {
  const subscription = {
    endpoint: subscriptionData.endpoint,
    keys: {
      p256dh: subscriptionData.p256dh,
      auth: subscriptionData.auth,
    },
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push-уведомление успешно отправлено.');
  } catch (error) {
    console.error('Ошибка при отправке push-уведомления:', error);
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Подписка устарела или не существует, будет удалена.');
      await deleteSubscriptionByEndpoint(subscription.endpoint);
    }
  }
};

module.exports = {
  sendNotification,
};