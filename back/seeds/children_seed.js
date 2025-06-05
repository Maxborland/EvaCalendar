const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('children').del();

  const adminUser = await knex('users').where({ email: 'admin@example.com' }).first();
  if (!adminUser) {
    throw new Error('Admin user with email admin@example.com not found. Please run the user seeds first.');
  }
  const adminUserUuid = adminUser.uuid;

  await knex('children').insert([
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      childName: 'Алексей Иванов',
      parentName: 'Мария Иванова',
      parentPhone: '+79001112233',
      address: 'ул. Пушкина, д. 10, кв. 5',
      hourlyRate: 500.00,
      comment: 'Аллергия на орехи'
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      childName: 'Ольга Петрова',
      parentName: 'Сергей Петров',
      parentPhone: '+79104445566',
      address: 'пр. Ленина, д. 25, кв. 12',
      hourlyRate: 600.00,
      comment: 'Любит рисовать'
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      childName: 'Дмитрий Сидоров',
      parentName: 'Елена Сидорова',
      parentPhone: '+79207778899',
      address: 'ул. Гагарина, д. 15, кв. 8',
      hourlyRate: 550.00,
      comment: ''
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      childName: 'Екатерина Морозова',
      parentName: 'Андрей Морозов',
      parentPhone: '+79309990011',
      address: 'ул. Свободы, д. 30, кв. 2',
      hourlyRate: 620.00,
      comment: 'Забирать в 18:00'
    },
    {
      uuid: uuidv4(),
      user_uuid: adminUserUuid,
      childName: 'Ирина Козлова',
      parentName: 'Иван Козлов',
      parentPhone: '+79402223344',
      address: 'пер. Цветочный, д. 7, кв. 1',
      hourlyRate: 580.00,
      comment: 'Носить очки'
    }
  ]);
};