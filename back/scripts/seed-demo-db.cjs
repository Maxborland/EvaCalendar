const knexLib = require('knex');
const bcrypt = require('bcryptjs');
const { randomUUID: uuidv4 } = require('crypto');
const knexfile = require('../knexfile.cjs');

const db = knexLib(knexfile.development);

const demo = {
  uuid: '10000000-0000-4000-8000-000000000001',
  username: 'demo',
  email: 'demo@example.com',
  password: 'password123',
};

const partner = {
  uuid: '10000000-0000-4000-8000-000000000002',
  username: 'vera',
  email: 'vera@example.com',
  password: 'password123',
};

function isoDate(offset) {
  const date = new Date('2026-06-01T00:00:00.000Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function upsertUser(user) {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const existing = await db('users').where({ email: user.email }).first();
  const payload = {
    uuid: user.uuid,
    username: user.username,
    email: user.email,
    hashed_password: hashedPassword,
    role: 'user',
    email_notifications_enabled: false,
  };

  if (existing) {
    await db('users').where({ uuid: existing.uuid }).update(payload);
    return payload;
  }

  await db('users').insert(payload);
  return payload;
}

async function clearDemoData() {
  const demoFamilyIds = await db('families').where({ owner_uuid: demo.uuid }).pluck('uuid');

  await db('tasks')
    .whereIn('creator_uuid', [demo.uuid, partner.uuid])
    .orWhereIn('user_uuid', [demo.uuid, partner.uuid])
    .orWhereIn('family_uuid', demoFamilyIds)
    .del();

  await db('notes').whereIn('user_uuid', [demo.uuid, partner.uuid]).del();
  await db('expense_categories').whereIn('user_uuid', [demo.uuid, partner.uuid]).del();
  await db('children').whereIn('user_uuid', [demo.uuid, partner.uuid]).del();
  await db('family_invitations').whereIn('family_uuid', demoFamilyIds).del();
  await db('family_members').whereIn('family_uuid', demoFamilyIds).del();
  await db('families').whereIn('uuid', demoFamilyIds).del();
}

async function seedFamily() {
  const family = {
    uuid: '20000000-0000-4000-8000-000000000001',
    name: 'Семья и занятия',
    owner_uuid: demo.uuid,
  };
  await db('families').insert(family);
  await db('family_members').insert([
    {
      uuid: uuidv4(),
      family_uuid: family.uuid,
      user_uuid: demo.uuid,
      role: 'owner',
      status: 'active',
      accepted_at: db.fn.now(),
    },
    {
      uuid: uuidv4(),
      family_uuid: family.uuid,
      user_uuid: partner.uuid,
      role: 'member',
      status: 'active',
      invited_by: demo.uuid,
      invited_at: db.fn.now(),
      accepted_at: db.fn.now(),
    },
  ]);

  return family;
}

async function seedChildren() {
  const rows = [
    {
      key: 'sonya',
      childName: 'Соня',
      parentName: 'Марина',
      parentPhone: '+7 913 222-45-10',
      address: 'Красный проспект, 42',
      hourlyRate: 1200,
      comment: 'Готовится к ВПР, лучше ставить короткие блоки по 45 минут.',
    },
    {
      key: 'max',
      childName: 'Макс',
      parentName: 'Илья',
      parentPhone: '+7 913 888-21-44',
      address: 'ул. Державина, 18',
      hourlyRate: 1500,
      comment: 'Сильный ученик, нужна олимпиадная математика.',
    },
    {
      key: 'alisa',
      childName: 'Алиса',
      parentName: 'Ольга',
      parentPhone: '+7 913 555-19-80',
      address: 'Онлайн, Zoom',
      hourlyRate: 1000,
      comment: 'Родители просят домашку заранее в Telegram.',
    },
    {
      key: 'timur',
      childName: 'Тимур',
      parentName: 'Рустам',
      parentPhone: '+7 913 707-04-18',
      address: 'ул. Кирова, 91',
      hourlyRate: 1300,
      comment: 'Оплата по пятницам, часто переносит время.',
    },
  ];

  const byKey = {};
  for (const row of rows) {
    const { key, ...child } = row;
    const payload = { uuid: uuidv4(), user_uuid: demo.uuid, ...child };
    await db('children').insert(payload);
    byKey[key] = payload;
  }

  return byKey;
}

async function seedCategories() {
  const byName = {};
  for (const categoryName of ['Транспорт', 'Материалы', 'Еда', 'Подписки', 'Дом и быт', 'Обучение']) {
    const payload = { uuid: uuidv4(), user_uuid: demo.uuid, categoryName };
    await db('expense_categories').insert(payload);
    byName[categoryName] = payload;
  }
  return byName;
}

function task(payload, familyUuid) {
  return {
    uuid: uuidv4(),
    creator_uuid: demo.uuid,
    user_uuid: payload.user_uuid || demo.uuid,
    family_uuid: payload.family_uuid || null,
    title: payload.title,
    type: payload.type,
    dueDate: payload.dueDate,
    time: payload.time || null,
    address: payload.address || null,
    comments: payload.comments || null,
    reminder_sent: false,
    reminder_at: payload.reminder_at || null,
    reminder_offset: payload.reminder_offset || null,
    child_uuid: payload.child_uuid || null,
    hoursWorked: payload.hoursWorked || null,
    amountEarned: payload.amountEarned || null,
    amountSpent: payload.amountSpent || null,
    expense_category_uuid: payload.expense_category_uuid || null,
  };
}

async function seedTasks(children, categories, family) {
  const rows = [
    task({ type: 'lesson', title: 'Математика: дроби', dueDate: isoDate(0), time: '10:00', child_uuid: children.sonya.uuid, address: children.sonya.address, comments: 'Взять распечатку с примерами.' }),
    task({ type: 'income', title: 'Оплата от Марины', dueDate: isoDate(0), time: '11:10', child_uuid: children.sonya.uuid, amountEarned: 1200, comments: 'Наличными после занятия.' }),
    task({ type: 'expense', title: 'Такси до занятия', dueDate: isoDate(0), time: '09:20', expense_category_uuid: categories['Транспорт'].uuid, amountSpent: 340 }),
    task({ type: 'task', title: 'Отправить домашку Соне', dueDate: isoDate(0), time: '18:00', comments: 'Фото тетради и 6 задач на закрепление.' }),
    task({ type: 'lesson', title: 'Олимпиадная математика', dueDate: isoDate(1), time: '16:30', child_uuid: children.max.uuid, address: children.max.address, comments: 'Разобрать комбинаторику.' }),
    task({ type: 'income', title: 'Оплата от Ильи', dueDate: isoDate(1), time: '17:45', child_uuid: children.max.uuid, amountEarned: 1500 }),
    task({ type: 'expense', title: 'Печать материалов', dueDate: isoDate(1), time: '13:20', expense_category_uuid: categories['Материалы'].uuid, amountSpent: 260 }),
    task({ type: 'task', title: 'Сверить оплаты за май', dueDate: isoDate(1), time: '20:30', comments: 'Проверить Соню, Макса, Тимура.' }),
    task({ type: 'lesson', title: 'Английский: reading', dueDate: isoDate(2), time: '12:00', child_uuid: children.alisa.uuid, address: children.alisa.address, comments: 'Онлайн, ссылка в чате.' }),
    task({ type: 'income', title: 'Оплата от Ольги', dueDate: isoDate(2), time: '12:55', child_uuid: children.alisa.uuid, amountEarned: 1000 }),
    task({ type: 'expense', title: 'Обед между занятиями', dueDate: isoDate(2), time: '14:10', expense_category_uuid: categories['Еда'].uuid, amountSpent: 520 }),
    task({ type: 'task', title: 'Подготовить план на июнь', dueDate: isoDate(2), time: '19:00', comments: 'Разнести по детям цели и частоту занятий.' }),
    task({ type: 'lesson', title: 'Физика: законы Ньютона', dueDate: isoDate(3), time: '15:00', child_uuid: children.timur.uuid, address: children.timur.address }),
    task({ type: 'income', title: 'Оплата от Рустама', dueDate: isoDate(3), time: '16:15', child_uuid: children.timur.uuid, amountEarned: 1300 }),
    task({ type: 'expense', title: 'Подписка на Zoom', dueDate: isoDate(3), time: '09:00', expense_category_uuid: categories['Подписки'].uuid, amountSpent: 899 }),
    task({ type: 'task', title: 'Купить продукты домой', dueDate: isoDate(3), time: '19:30', user_uuid: partner.uuid, family_uuid: family.uuid, comments: 'Семейная задача, назначена Вере.' }),
    task({ type: 'lesson', title: 'Математика: уравнения', dueDate: isoDate(4), time: '10:30', child_uuid: children.sonya.uuid, address: children.sonya.address }),
    task({ type: 'lesson', title: 'Разбор пробника', dueDate: isoDate(4), time: '17:00', child_uuid: children.max.uuid, address: children.max.address }),
    task({ type: 'income', title: 'Две оплаты за пятницу', dueDate: isoDate(4), time: '18:20', amountEarned: 2700, comments: 'Соня + Макс.' }),
    task({ type: 'expense', title: 'Канцелярия', dueDate: isoDate(4), time: '12:40', expense_category_uuid: categories['Материалы'].uuid, amountSpent: 430 }),
    task({ type: 'task', title: 'Запланировать выходные без перегруза', dueDate: isoDate(4), time: '21:00', comments: 'Оставить воскресенье свободным.' }),
    task({ type: 'lesson', title: 'Алиса: speaking practice', dueDate: isoDate(5), time: '11:00', child_uuid: children.alisa.uuid, address: children.alisa.address }),
    task({ type: 'income', title: 'Онлайн оплата Алиса', dueDate: isoDate(5), time: '11:55', child_uuid: children.alisa.uuid, amountEarned: 1000 }),
    task({ type: 'expense', title: 'Курс по методике', dueDate: isoDate(5), time: '18:30', expense_category_uuid: categories['Обучение'].uuid, amountSpent: 1800 }),
    task({ type: 'task', title: 'Разобрать входящие и чеки', dueDate: isoDate(5), time: '16:00', comments: 'Сфотографировать чеки, внести расходы.' }),
    task({ type: 'task', title: 'Семейный бюджет: продукты и планы', dueDate: isoDate(6), time: '12:00', comments: 'Проверить баланс недели и лимиты.' }),
    task({ type: 'expense', title: 'Домашние покупки', dueDate: isoDate(6), time: '13:30', expense_category_uuid: categories['Дом и быт'].uuid, amountSpent: 2450 }),
    task({ type: 'income', title: 'Предоплата за следующую неделю', dueDate: isoDate(6), time: '19:15', amountEarned: 2000, comments: 'От Рустама за Тимура.' }),
  ];

  await db('tasks').insert(rows);
}

async function seedNotes() {
  await db('notes').insert([
    { uuid: uuidv4(), user_uuid: demo.uuid, date: isoDate(0), content: 'Фокус дня: не ставить больше трех крупных дел. После первого занятия сразу закрыть оплату и заметки.' },
    { uuid: uuidv4(), user_uuid: demo.uuid, date: isoDate(2), content: 'Среда плотная: проверить, что между онлайн-занятием и обедом есть пауза. Вечером собрать план июня.' },
    { uuid: uuidv4(), user_uuid: demo.uuid, date: isoDate(4), content: 'Пятница денежная: две оплаты, материалы, вечернее планирование. Хороший день для проверки финансового блока.' },
    { uuid: uuidv4(), user_uuid: demo.uuid, date: isoDate(6), content: 'Воскресенье оставить мягким: только семейный бюджет, покупки и подготовка к новой неделе.' },
  ]);
}

async function main() {
  await upsertUser(demo);
  await upsertUser(partner);
  await clearDemoData();

  const family = await seedFamily();
  const children = await seedChildren();
  const categories = await seedCategories();
  await seedTasks(children, categories, family);
  await seedNotes();

  const summary = {
    login: demo.email,
    passwordHint: 'Use the local demo password from project docs.',
    familyMembers: await db('family_members').where({ family_uuid: family.uuid }).count({ count: '*' }).first(),
    children: await db('children').where({ user_uuid: demo.uuid }).count({ count: '*' }).first(),
    categories: await db('expense_categories').where({ user_uuid: demo.uuid }).count({ count: '*' }).first(),
    tasks: await db('tasks').where({ creator_uuid: demo.uuid }).count({ count: '*' }).first(),
    notes: await db('notes').where({ user_uuid: demo.uuid }).count({ count: '*' }).first(),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
