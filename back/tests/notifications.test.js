const webpush = require('web-push');
const { v4: uuidv4 } = require('uuid');
const { checkAndSendReminders } = require('../scheduler');
const db = require('../db.cjs');

// Мокаем web-push, чтобы не отправлять реальные уведомления
jest.mock('web-push');

describe('Scheduler for Task Reminders', () => {
  beforeEach(async () => {
    // Очищаем таблицы перед каждым тестом
    await db('tasks').del();
    await db('notification_subscriptions').del();
    await db('users').del();
    // Сбрасываем моки перед каждым тестом
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Закрываем соединение с БД после всех тестов
    await db.destroy();
  });

  it('should find a task that needs a reminder and send a notification', async () => {
    // 1. Подготовка данных
    const userUUID = uuidv4();
    const user = {
      uuid: userUUID,
      username: 'testuser',
      hashed_password: 'password',
      email: 'test@example.com',
    };
    await db('users').insert(user);

    const reminderTime = new Date();
    reminderTime.setMinutes(reminderTime.getMinutes() + 3); // Через 3 минуты
    const reminderAtISO = reminderTime.toISOString();

    const taskUUID = uuidv4();
    const task = {
      uuid: taskUUID,
      user_uuid: userUUID,
      title: 'Test Task',
      type: 'reminder', // Добавим тип задачи
      reminder_at: reminderAtISO,
      reminder_sent: false,
    };
    await db('tasks').insert(task);

    const subscription = {
      uuid: uuidv4(),
      user_uuid: userUUID,
      endpoint: 'https://example.com/push/123',
      keys: JSON.stringify({
        p256dh: 'key',
        auth: 'secret'
      }),
    };
    await db('notification_subscriptions').insert(subscription);

    // 2. Выполнение
    await checkAndSendReminders();

    // 3. Проверки
    // Проверяем, что sendNotification был вызван
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);

    // Проверяем, что sendNotification был вызван с правильными данными
    const expectedPayload = {
      title: 'Напоминание о задаче',
      body: `Скоро начнется ваша задача: "${task.title}"`,
      icon: '/icons/web/icon-192.png',
    };

    const passedSubscriptionData = webpush.sendNotification.mock.calls[0][0];
    const passedPayload = webpush.sendNotification.mock.calls[0][1];

    const expectedSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: 'key',
        auth: 'secret',
      },
    };
    expect(passedSubscriptionData).toEqual(expectedSubscription);
    expect(JSON.parse(passedPayload)).toEqual(expectedPayload);

    // Проверяем, что у задачи обновился флаг reminder_sent
    const updatedTask = await db('tasks').where('uuid', task.uuid).first();
    expect(updatedTask.reminder_sent).toBe(1); // В SQLite true это 1
  });

  it('should not send a reminder if the task is not due yet', async () => {
    // 1. Подготовка данных
    const userUUID = uuidv4();
    const user = {
      uuid: userUUID,
      username: 'testuser2',
      hashed_password: 'password',
      email: 'test2@example.com',
    };
    await db('users').insert(user);

    const reminderTime = new Date();
    reminderTime.setMinutes(reminderTime.getMinutes() + 10); // Через 10 минут
    const reminderAtISO = reminderTime.toISOString();

    const taskUUID = uuidv4();
    const task = {
      uuid: taskUUID,
      user_uuid: userUUID,
      title: 'Future Task',
      type: 'reminder',
      reminder_at: reminderAtISO,
      reminder_sent: false,
    };
    await db('tasks').insert(task);

    // 2. Выполнение
    await checkAndSendReminders();

    // 3. Проверки
    expect(webpush.sendNotification).not.toHaveBeenCalled();

    const notUpdatedTask = await db('tasks').where('uuid', task.uuid).first();
    expect(notUpdatedTask.reminder_sent).toBe(0);
  });
});