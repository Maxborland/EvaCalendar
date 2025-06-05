const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @return { Promise<void> }
 */
exports.seed = async function(knex) {
  // Удаляем существующие задачи
  await knex('tasks').del();

  // Получаем UUID администратора
  const adminUser = await knex('users').where({ email: 'admin@example.com' }).first();
  if (!adminUser) {
    console.warn('Admin user not found. Seed data for tasks might be incomplete.');
    return; // Прерываем выполнение, если админ не найден
  }
  const adminUserUuid = adminUser.uuid;

  // Получаем UUID первого ребенка, принадлежащего adminUserUuid
  const firstChild = await knex('children').where({ user_uuid: adminUserUuid }).first();
  if (!firstChild) {
    console.warn('No child found for admin user, tasks may not be fully seeded or may need default child_uuid.');
  }
  const childUuid = firstChild ? firstChild.uuid : null;

  // Получаем UUID первой категории расходов, принадлежащей adminUserUuid
  const firstCategory = await knex('expense_categories').where({ user_uuid: adminUserUuid }).first();
  if (!firstCategory) {
    console.warn('No expense category found, tasks may not be fully seeded or may need default expense_category_uuid.');
  }
  const categoryUuid = firstCategory ? firstCategory.uuid : null;

  // Вставляем данные задач
  await knex('tasks').insert([
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: childUuid, // Используем полученный childUuid
      expense_category_uuid: null, // Для задач типа 'income' категория расходов может быть null
      type: 'income',
      title: 'Помощь по дому',
      time: '10:00',
      // duration_minutes: 120, // 2 часа - Этого поля нет в миграции
      // Поля, специфичные для income
      hoursWorked: 2,
      amountEarned: 10.50,
      // Поля, специфичные для expense, должны быть null
      amountSpent: null,
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: childUuid, // Используем тот же childUuid для примера
      expense_category_uuid: null,
      type: 'income',
      title: 'Урок математики',
      time: '14:30',
      // duration_minutes: 60, // 1 час - Этого поля нет в миграции
      // status: 'pending', // Этого поля нет в миграции
      // is_recurring: true, // Этого поля нет в миграции
      // recurring_pattern: 'weekly', // Этого поля нет в миграции
      hoursWorked: 1,
      amountEarned: 25.00, // Пример значения
      amountSpent: null,
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: null, // Эта задача не привязана к ребенку
      expense_category_uuid: categoryUuid, // Используем полученный categoryUuid
      type: 'expense',
      title: 'Поход в магазин',
      time: '17:00', // Пример времени
      // duration_minutes: 45, // Пример длительности - Этого поля нет в миграции
      // status: 'completed', // Этого поля нет в миграции
      // is_recurring: false, // Этого поля нет в миграции
      // Поля, специфичные для income, должны быть null
      hoursWorked: null,
      amountEarned: null,
      // Поля, специфичные для expense
      amountSpent: 55.75, // Пример значения
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: childUuid,
      expense_category_uuid: null,
      type: 'income',
      title: 'Работа над проектом',
      time: '11:00',
      // duration_minutes: 180, // 3 часа - Этого поля нет в миграции
      // status: 'in_progress', // Этого поля нет в миграции
      // is_recurring: false, // Этого поля нет в миграции
      hoursWorked: 3,
      amountEarned: 150.00, // Пример значения
      amountSpent: null,
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: null,
      expense_category_uuid: categoryUuid, // Используем тот же categoryUuid для примера
      type: 'expense',
      title: 'Оплата счетов',
      time: '09:00', // Пример времени
      // duration_minutes: 30, // Пример длительности - Этого поля нет в миграции
      // status: 'pending', // Этого поля нет в миграции
      // is_recurring: true, // Этого поля нет в миграции
      // recurring_pattern: 'monthly', // Этого поля нет в миграции
      hoursWorked: null,
      amountEarned: null,
      amountSpent: 75.00, // Пример значения
    }
  ]);
  console.log('Tasks seeded successfully.');
};