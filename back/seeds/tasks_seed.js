/**
 * @param { import("knex").Knex } knex
 * @return { Promise<void> }
 */
exports.seed = async function(knex) {
  const { v4: uuidv4 } = require('uuid');
  // Deletes ALL existing entries
  await knex('tasks').del();

  // Inserts seed entries
  const children = await knex('children').select('uuid').limit(3);
  const expenseCategories = await knex('expense_categories').select('uuid').limit(2);

  await knex('tasks').insert([
    {
      uuid: uuidv4(),
      type: 'income',
      title: 'Помощь по дому',
      dueDate: new Date().toISOString().split('T')[0],
      time: '10:00',
      childId: children[0] ? children[0].uuid : null,
      hoursWorked: 2,
      amountEarned: 10.50,
      amountSpent: null,
      expenseTypeId: null
    },
    {
      uuid: uuidv4(),
      type: 'income',
      title: 'Урок математики',
      dueDate: new Date().toISOString().split('T')[0],
      time: '14:30',
      childId: children[1] ? children[1].uuid : null,
      hoursWorked: 1,
      amountEarned: null,
      amountSpent: null,
      expenseTypeId: null
    },
    {
      uuid: uuidv4(),
      type: 'expense',
      title: 'Поход в магазин',
      dueDate: new Date().toISOString().split('T')[0],
      amountSpent: 5.75,
      comments: 'Покупки в магазине',
      expenseTypeId: expenseCategories[0] ? expenseCategories[0].uuid : null
    },
    {
      uuid: uuidv4(),
      type: 'income',
      title: 'Работа над проектом',
      dueDate: new Date().toISOString().split('T')[0],
      time: '11:00',
      childId: children[2] ? children[2].uuid : null,
      hoursWorked: 3,
      amountEarned: 15.00,
      amountSpent: null,
      expenseTypeId: null
    },
    {
      uuid: uuidv4(),
      type: 'expense',
      title: 'Рисование',
      dueDate: new Date().toISOString().split('T')[0],
      amountSpent: 2.00,
      comments: 'Покупки в магазине',
      expenseTypeId: expenseCategories[1] ? expenseCategories[1].uuid : null
    }
  ]);
};