const webpush = require('web-push');
const knex = require('../db.cjs');
const { log, error: logError } = require('../utils/logger.js');
const { sendEmail } = require('./emailService.js');

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendNotification = async (subscription, payload) => {
  const sub = {
    endpoint: subscription.endpoint,
    keys: typeof subscription.keys === 'string' ? JSON.parse(subscription.keys) : subscription.keys,
  };

  // Патч для старых эндпоинтов Google FCM
  if (sub.endpoint.startsWith('https://fcm.googleapis.com/fcm/send')) {
    sub.endpoint = sub.endpoint.replace('/fcm/send', '/wp');
  }

  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
  } catch (error) {
    logError(`Failed to send notification to ${sub.endpoint.substring(0, 50)}...:`, error.statusCode);
    // Если подписка больше не действительна (например, истек срок ее действия или она отозвана), удаляем ее.
    if (error.statusCode === 404 || error.statusCode === 410) {
      log(`Deleting invalid subscription: ${sub.endpoint.substring(0, 50)}...`);
      await knex('notification_subscriptions').where({ endpoint: sub.endpoint }).del();
    } else {
      // Перебрасываем другие ошибки, чтобы их можно было обработать выше
      throw error;
    }
  }
};

const sendTestNotification = async (userId) => {
  const user = await knex('users').where({ uuid: userId }).first();
  if (!user) {
    throw new Error('User not found.');
  }

  const notificationPayload = {
    title: 'Тестовое уведомление',
    body: 'Это тестовое уведомление от EvaCalendar!',
    icon: '/icons/web/icon-192.png',
  };

  // 1. Отправка Push-уведомлений (существующая логика)
  const subscriptions = await knex('notification_subscriptions').where({ user_uuid: userId });
  if (subscriptions.length > 0) {
    const pushPromises = subscriptions.map(sub => sendNotification(sub, notificationPayload));
    const pushResults = await Promise.allSettled(pushPromises);
    pushResults.forEach(result => {
      if (result.status === 'rejected') {
        logError('An unexpected error occurred during push notification sending:', result.reason);
      }
    });
  }

  // 2. Отправка Email-уведомления, если включено
  if (user.email_notifications_enabled) {
    try {
      await sendEmail(
        user.email,
        notificationPayload.title,
        notificationPayload.body,
        `<p>${notificationPayload.body}</p>`
      );
    } catch (error) {
       logError('An unexpected error occurred during email notification sending:', error);
    }
  }

  if (subscriptions.length === 0 && !user.email_notifications_enabled) {
    throw new Error('No notification methods enabled for this user.');
  }
};

module.exports = {
  sendNotification,
  sendTestNotification,
};