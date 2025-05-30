export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('expense_categories').del();

  // Inserts seed entries
  await knex('expense_categories').insert([
    { category_name: 'Продукты' },
    { category_name: 'Транспорт' },
    { category_name: 'Развлечения' },
    { category_name: 'Одежда' },
    { category_name: 'Образование' },
    { category_name: 'Здоровье' },
    { category_name: 'Коммунальные услуги' },
    { category_name: 'Подарки' },
    { category_name: 'Рестораны и кафе' },
    { category_name: 'Дом и ремонт' },
  ]);
}