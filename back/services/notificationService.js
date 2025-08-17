const webpush = require('web-push');
const knex = require('../db.cjs');
const { log, error: logError } = require('../utils/logger.js');
const { sendEmail } = require('./emailService.js');

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async (subscription, payload) => {
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

const sendNotificationToUser = async (userId, notificationPayload) => {
  const user = await knex('users').where({ uuid: userId }).first();
  if (!user) {
    throw new Error('User not found.');
  }

  // 1. Отправка Email-уведомления, если включено
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

  // 2. Отправка Push-уведомлений
  const subscriptions = await knex('notification_subscriptions').where({ user_uuid: userId });
  if (subscriptions.length > 0) {
    subscriptions.forEach(subscription => {
      if (subscription.keys && typeof subscription.keys === 'string') {
        try {
          subscription.keys = JSON.parse(subscription.keys);
        } catch (err) {
          logError(`Failed to parse subscription keys for endpoint ${subscription.endpoint}:`, err);
        }
      }
    });

    const pushPromises = subscriptions.map(sub => sendPushNotification(sub, notificationPayload));
    const pushResults = await Promise.allSettled(pushPromises);
    pushResults.forEach(result => {
      if (result.status === 'rejected') {
        logError('An unexpected error occurred during push notification sending:', result.reason);
      }
    });
  }

  if (subscriptions.length === 0 && !user.email_notifications_enabled) {
    throw new Error('No notification methods enabled for this user.');
  }
};

const sendTestNotification = async (userId) => {
  const notificationPayload = {
    title: 'Тестовое уведомление',
    body: 'Это тестовое уведомление от EvaCalendar!',
    icon: '/icons/web/icon-192.png',
  };

  await sendNotificationToUser(userId, notificationPayload);
};

const createPushSubscription = async (user_uuid, subscription) => {
  const { endpoint, keys } = subscription;
  const [newSubscription] = await knex('notification_subscriptions')
    .insert({
      user_uuid,
      endpoint,
      keys: JSON.stringify(keys),
    })
    .onConflict('endpoint')
    .merge()
    .returning('*');
  return newSubscription;
};

const deletePushSubscription = async (user_uuid, endpoint) => {
  await knex('notification_subscriptions')
    .where({ user_uuid, endpoint })
    .del();
};

const getSubscriptionsByUserId = async (user_uuid) => {
  return await knex('notification_subscriptions').where({ user_uuid });
};

module.exports = {
  sendPushNotification,
  sendNotification: sendPushNotification, // Алиас для совместимости с планировщиком
  sendNotificationToUser,
  sendTestNotification,
  createPushSubscription,
  deletePushSubscription,
  getSubscriptionsByUserId,
};