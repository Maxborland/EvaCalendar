const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @return { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('tasks').del();

  const adminUser = await knex('users').where({ email: 'admin@example.com' }).first();
  if (!adminUser) {
    // console.warn('Admin user not found. Seed data for tasks might be incomplete.'); // Удалено для уменьшения логирования
    return;
  }
  const adminUserUuid = adminUser.uuid;

  const firstChild = await knex('children').where({ user_uuid: adminUserUuid }).first();
  if (!firstChild) {
    // console.warn('No child found for admin user, tasks may not be fully seeded or may need default child_uuid.'); // Удалено для уменьшения логирования
  }
  const childUuid = firstChild ? firstChild.uuid : null;

  const firstCategory = await knex('expense_categories').where({ user_uuid: adminUserUuid }).first();
  if (!firstCategory) {
    // console.warn('No expense category found, tasks may not be fully seeded or may need default expense_category_uuid.'); // Удалено для уменьшения логирования
  }
  const categoryUuid = firstCategory ? firstCategory.uuid : null;

  await knex('tasks').insert([
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: childUuid,
      expense_category_uuid: null,
      type: 'income',
      title: 'Помощь по дому',
      time: '10:00',
      hoursWorked: 2,
      amountEarned: 10.50,
      amountSpent: null,
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: childUuid,
      expense_category_uuid: null,
      type: 'income',
      title: 'Урок математики',
      time: '14:30',
      hoursWorked: 1,
      amountEarned: 25.00,
      amountSpent: null,
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: null,
      expense_category_uuid: categoryUuid,
      type: 'expense',
      title: 'Поход в магазин',
      time: '17:00',
      hoursWorked: null,
      amountEarned: null,
      amountSpent: 55.75,
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: childUuid,
      expense_category_uuid: null,
      type: 'income',
      title: 'Работа над проектом',
      time: '11:00',
      hoursWorked: 3,
      amountEarned: 150.00,
      amountSpent: null,
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      child_uuid: null,
      expense_category_uuid: categoryUuid,
      type: 'expense',
      title: 'Оплата счетов',
      time: '09:00',
      hoursWorked: null,
      amountEarned: null,
      amountSpent: 75.00,
    }
  ]);
  console.log('Tasks seeded successfully.');
};