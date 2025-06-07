const cron = require('node-cron');
const db = require('./db.cjs');
const { sendNotification } = require('./services/notificationService');

// Вспомогательная функция для поиска задач, у которых скоро дедлайн.
// **Важно**: Эта функция предполагает, что в вашей таблице `tasks` есть колонка `reminder_sent` (boolean).
// Если ее нет, рекомендуется создать новую миграцию для ее добавления, чтобы избежать повторной отправки уведомлений.
const findTasksNearingDeadline = async () => {
  const now = new Date();
  const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

  return db('tasks')
    .where('reminder_at', '>', now.toISOString())
    .andWhere('reminder_at', '<=', fiveMinutesLater.toISOString())
    .andWhere(function() {
      this.where('reminder_sent', false).orWhereNull('reminder_sent');
    });
};

// Вспомогательная функция для поиска подписок пользователя.
const findSubscriptionsByUserId = async (userUUID) => {
  return db('notification_subscriptions').where('user_uuid', userUUID);
};

// Логика проверки и отправки уведомлений
const checkAndSendReminders = async () => {
  console.log('Scheduler: Запуск проверки задач для отправки уведомлений...');

  try {
    const tasks = await findTasksNearingDeadline();

    if (tasks.length === 0) {
      console.log('Scheduler: Нет задач для уведомления.');
      return;
    }

    for (const task of tasks) {
      const subscriptions = await findSubscriptionsByUserId(task.user_uuid);
      if (subscriptions.length === 0) {
        continue; // Пропускаем, если у пользователя нет подписок
      }

      const payload = {
        title: 'Напоминание о задаче',
        body: `Скоро начнется ваша задача: "${task.title}"`,
        icon: '/icons/web/icon-192.png'
      };

      console.log(`Scheduler: Найдена задача "${task.title}" для пользователя ${task.user_uuid}. Отправка уведомлений...`);

      for (const subscription of subscriptions) {
        await sendNotification(subscription, payload);
      }

      // Отмечаем, что напоминание для этой задачи было отправлено
      await db('tasks').where('uuid', task.uuid).update({ reminder_sent: true });
    }
  } catch (error) {
    console.error('Scheduler: Ошибка в планировщике уведомлений:', error);
  }
};


// Основная функция планировщика
const scheduleTaskReminders = () => {
  // Запускаем задачу каждую минуту.
  cron.schedule('* * * * *', checkAndSendReminders);
};

module.exports = {
  scheduleTaskReminders,
  checkAndSendReminders, // Экспортируем для тестов
  findTasksNearingDeadline,
  findSubscriptionsByUserId
};