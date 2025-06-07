const webpush = require('web-push');
const knex = require('../db.cjs');

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendTestNotification = async (userId) => {
  const subscriptions = await knex('notification_subscriptions').where({ user_uuid: userId });

  if (subscriptions.length === 0) {
    throw new Error('No subscriptions found for this user.');
  }

  const notificationPayload = JSON.stringify({
    title: 'Тестовое уведомление',
    body: 'Это тестовое уведомление от EvaCalendar!',
    icon: '/icons/web/icon-192.png',
  });

  const promises = subscriptions.map(sub => {
    const subscription = {
      endpoint: sub.endpoint,
      keys: typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys,
    };
    if (subscription.endpoint.startsWith('https://fcm.googleapis.com/fcm/send')) {
      subscription.endpoint = subscription.endpoint.replace('/fcm/send', '/wp');
    }
    return webpush.sendNotification(subscription, notificationPayload)
      .catch(error => {
        console.error(`Failed to send notification to ${subscription.endpoint.substring(0, 50)}...:`, error.statusCode);
        // Если подписка больше не действительна (например, истек срок ее действия или она отозвана), удаляем ее.
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`Deleting invalid subscription: ${subscription.endpoint.substring(0, 50)}...`);
          return knex('notification_subscriptions').where({ endpoint: sub.endpoint }).del();
        }
      });
  });

  const results = await Promise.allSettled(promises);

  results.forEach(result => {
    if (result.status === 'rejected') {
      console.error('An unexpected error occurred during notification sending:', result.reason);
    }
  });
};

module.exports = {
  sendTestNotification,
};