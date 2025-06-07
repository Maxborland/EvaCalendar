const notificationService = require('../services/notificationService');
const db = require('../db.cjs');

const sendTestNotification = async (req, res, next) => {
  try {
    const user_uuid = req.user.uuid;
if (!user_uuid) {
      return res.status(400).json({ message: 'Идентификатор пользователя не найден в запросе.' });
    }

    const subscriptions = await db('notification_subscriptions').where('user_uuid', user_uuid);

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ message: 'Для этого пользователя подписки не найдены.' });
    }

    const payload = {
      title: 'Тестовое уведомление',
      body: 'Это тестовое push-уведомление от EvaCalendar!',
      icon: '/icons/web/icon-192.png'
    };

    for (const subscription of subscriptions) {
      const subObject = typeof subscription.subscription_object === 'string'
        ? JSON.parse(subscription.subscription_object)
        : subscription.subscription_object;
      await notificationService.sendNotification(subObject, payload);
    }

    res.status(200).json({ message: 'Тестовые уведомления успешно отправлены.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendTestNotification,
};