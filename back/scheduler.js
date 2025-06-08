const cron = require('node-cron');
const db = require('./db.cjs');
const { sendNotification } = require('./services/notificationService');
const { log, error: logError } = require('./utils/logger.js');

const runningJobs = []; // Массив для хранения запущенных cron-задач

// Вспомогательная функция для поиска задач, у которых скоро дедлайн.
// **Важно**: Эта функция предполагает, что в вашей таблице `tasks` есть колонка `reminder_sent` (boolean).
// Если ее нет, рекомендуется создать новую миграцию для ее добавления, чтобы избежать повторной отправки уведомлений.
const findTasksNearingDeadline = async () => {
  const now = new Date();
  // Устанавливаем секунды и миллисекунды в 0, чтобы получить начало текущей минуты.
  now.setSeconds(0, 0);

  // Конец текущей минуты (начало следующей).
  const oneMinuteLater = new Date(now.getTime() + 60 * 1000);

  // Ищем задачи, время напоминания которых находится в интервале текущей минуты.
  return db('tasks')
    .where('reminder_at', '>=', now)
    .andWhere('reminder_at', '<', oneMinuteLater)
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
  log('Scheduler: Запуск проверки дел для отправки уведомлений...');

  try {
    const tasks = await findTasksNearingDeadline();

    if (tasks.length === 0) {
      log('Scheduler: Нет дел для уведомления.');
      return;
    }

    for (const task of tasks) {
      const subscriptions = await findSubscriptionsByUserId(task.user_uuid);
      if (subscriptions.length === 0) {
        continue; // Пропускаем, если у пользователя нет подписок
      }

      const payload = {
        title: 'Напоминание о деле',
        body: `Зяка, не забудь о деле: "${task.title}"`,
        icon: '/icons/web/icon-192.png'
      };

      log(`Scheduler: Найдено дело "${task.title}" для пользователя ${task.user_uuid}. Отправка уведомлений...`);

      for (const subscription of subscriptions) {
        await sendNotification(subscription, payload);
      }

      // Отмечаем, что напоминание для этой задачи было отправлено
      await db('tasks').where('uuid', task.uuid).update({ reminder_sent: true });
    }
  } catch (error) {
    logError('Scheduler: Ошибка в планировщике уведомлений:', error);
  }
};


// Основная функция планировщика
const scheduleTaskReminders = () => {
  // Запускаем задачу каждую минуту.
  const job = cron.schedule('* * * * *', checkAndSendReminders);
  runningJobs.push(job);
};

const stopAllCronJobs = () => {
 runningJobs.forEach(job => {
   job.stop();
 });
 log('Scheduler: Все cron-задачи остановлены.');
};

module.exports = {
  scheduleTaskReminders,
  stopAllCronJobs, // Экспортируем функцию для остановки задач
  checkAndSendReminders, // Экспортируем для тестов
  findTasksNearingDeadline,
  findSubscriptionsByUserId
};