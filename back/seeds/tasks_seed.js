/**
 * @param { import("knex").Knex } knex
 * @return { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('tasks').del();

  // Inserts seed entries
  await knex('tasks').insert([
    {
      type: 'income',
      title: 'Помощь по дому',
      time: '10:00',
      childId: 1, // Assume child with ID 1 exists
      hoursWorked: 2,
      amountEarned: 10.50,
      amountSpent: null,
      expenceTypeId: null
    },
    {
      type: 'income',
      title: 'Урок математики',
      time: '14:30',
      childId: 2, // Assume child with ID 2 exists
      hoursWorked: 1,
      amountEarned: null,
      amountSpent: null,
      expenceTypeId: null
    },
    {
      type: 'expense',
      title: 'Поход в магазин',
      amountSpent: 5.75,
      comments: 'Покупки в магазине',
      expenceTypeId: 1 // Assume expense category with ID 1 exists
    },
    {
      type: 'income',
      title: 'Работа над проектом',
      time: '11:00',
      childId: 3, // Assume child with ID 3 exists
      hoursWorked: 3,
      amountEarned: 15.00,
      amountSpent: null,
      expenceTypeId: null
    },
    {
      type: 'expense',
      title: 'Рисование',
      amountSpent: 2.00,
      comments: 'Покупки в магазине',
      expenceTypeId: 2 // Assume expense category with ID 2 exists
    }
  ]);
}