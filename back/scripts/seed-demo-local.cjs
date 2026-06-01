const BASE_URL = process.env.DEMO_BASE_URL || 'http://127.0.0.1:3001/api';

const demoUser = {
  username: 'demo',
  email: 'demo@example.com',
  password: 'password123',
};

const post = (path, token, body) => request(path, token, 'POST', body);
const del = (path, token) => request(path, token, 'DELETE');

async function request(path, token, method = 'GET', body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${text}`);
  }

  return data;
}

function isoDate(offset) {
  const date = new Date('2026-06-01T00:00:00.000Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function ensureDemoUser() {
  try {
    await post('/auth/register', null, demoUser);
  } catch (error) {
    if (!error.message.includes('409')) {
      throw error;
    }
  }

  const login = await post('/auth/login', null, {
    identifier: demoUser.email,
    password: demoUser.password,
  });

  return login.token;
}

async function clearDemoData(token) {
  const [tasks, notes, categories, children] = await Promise.all([
    request('/tasks', token),
    request('/notes', token),
    request('/expense-categories', token),
    request('/children', token),
  ]);

  for (const task of tasks) await del(`/tasks/${task.uuid}`, token);
  for (const note of notes) await del(`/notes/${note.uuid}`, token);
  for (const category of categories) await del(`/expense-categories/${category.uuid}`, token);
  for (const child of children) await del(`/children/${child.uuid}`, token);
}

async function seedDemoData(token) {
  const children = {};
  for (const child of [
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
  ]) {
    const { key, ...payload } = child;
    children[key] = await post('/children', token, payload);
  }

  const categories = {};
  for (const categoryName of ['Транспорт', 'Материалы', 'Еда', 'Подписки', 'Дом и быт', 'Обучение']) {
    categories[categoryName] = await post('/expense-categories', token, { categoryName });
  }

  const taskPayloads = [
    {
      type: 'lesson',
      title: 'Математика: дроби',
      dueDate: isoDate(0),
      time: '10:00',
      child_uuid: children.sonya.uuid,
      address: children.sonya.address,
      comments: 'Взять распечатку с примерами.',
    },
    {
      type: 'income',
      title: 'Оплата от Марины',
      dueDate: isoDate(0),
      time: '11:10',
      child_uuid: children.sonya.uuid,
      amountEarned: 1200,
      comments: 'Наличными после занятия.',
    },
    {
      type: 'expense',
      title: 'Такси до занятия',
      dueDate: isoDate(0),
      time: '09:20',
      expense_category_uuid: categories['Транспорт'].uuid,
      amountSpent: 340,
    },
    {
      type: 'task',
      title: 'Отправить домашку Соне',
      dueDate: isoDate(0),
      time: '18:00',
      comments: 'Фото тетради и 6 задач на закрепление.',
    },
    {
      type: 'lesson',
      title: 'Олимпиадная математика',
      dueDate: isoDate(1),
      time: '16:30',
      child_uuid: children.max.uuid,
      address: children.max.address,
      comments: 'Разобрать комбинаторику.',
    },
    {
      type: 'income',
      title: 'Оплата от Ильи',
      dueDate: isoDate(1),
      time: '17:45',
      child_uuid: children.max.uuid,
      amountEarned: 1500,
    },
    {
      type: 'expense',
      title: 'Печать материалов',
      dueDate: isoDate(1),
      time: '13:20',
      expense_category_uuid: categories['Материалы'].uuid,
      amountSpent: 260,
    },
    {
      type: 'task',
      title: 'Сверить оплаты за май',
      dueDate: isoDate(1),
      time: '20:30',
      comments: 'Проверить Соню, Макса, Тимура.',
    },
    {
      type: 'lesson',
      title: 'Английский: reading',
      dueDate: isoDate(2),
      time: '12:00',
      child_uuid: children.alisa.uuid,
      address: children.alisa.address,
      comments: 'Онлайн, ссылка в чате.',
    },
    {
      type: 'income',
      title: 'Оплата от Ольги',
      dueDate: isoDate(2),
      time: '12:55',
      child_uuid: children.alisa.uuid,
      amountEarned: 1000,
    },
    {
      type: 'expense',
      title: 'Обед между занятиями',
      dueDate: isoDate(2),
      time: '14:10',
      expense_category_uuid: categories['Еда'].uuid,
      amountSpent: 520,
    },
    {
      type: 'task',
      title: 'Подготовить план на июнь',
      dueDate: isoDate(2),
      time: '19:00',
      comments: 'Разнести по детям цели и частоту занятий.',
    },
    {
      type: 'lesson',
      title: 'Физика: законы Ньютона',
      dueDate: isoDate(3),
      time: '15:00',
      child_uuid: children.timur.uuid,
      address: children.timur.address,
    },
    {
      type: 'income',
      title: 'Оплата от Рустама',
      dueDate: isoDate(3),
      time: '16:15',
      child_uuid: children.timur.uuid,
      amountEarned: 1300,
    },
    {
      type: 'expense',
      title: 'Подписка на Zoom',
      dueDate: isoDate(3),
      time: '09:00',
      expense_category_uuid: categories['Подписки'].uuid,
      amountSpent: 899,
    },
    {
      type: 'lesson',
      title: 'Математика: уравнения',
      dueDate: isoDate(4),
      time: '10:30',
      child_uuid: children.sonya.uuid,
      address: children.sonya.address,
    },
    {
      type: 'lesson',
      title: 'Разбор пробника',
      dueDate: isoDate(4),
      time: '17:00',
      child_uuid: children.max.uuid,
      address: children.max.address,
    },
    {
      type: 'income',
      title: 'Две оплаты за пятницу',
      dueDate: isoDate(4),
      time: '18:20',
      amountEarned: 2700,
      comments: 'Соня + Макс.',
    },
    {
      type: 'expense',
      title: 'Канцелярия',
      dueDate: isoDate(4),
      time: '12:40',
      expense_category_uuid: categories['Материалы'].uuid,
      amountSpent: 430,
    },
    {
      type: 'task',
      title: 'Запланировать выходные без перегруза',
      dueDate: isoDate(4),
      time: '21:00',
      comments: 'Оставить воскресенье свободным.',
    },
    {
      type: 'lesson',
      title: 'Алиса: speaking practice',
      dueDate: isoDate(5),
      time: '11:00',
      child_uuid: children.alisa.uuid,
      address: children.alisa.address,
    },
    {
      type: 'income',
      title: 'Онлайн оплата Алиса',
      dueDate: isoDate(5),
      time: '11:55',
      child_uuid: children.alisa.uuid,
      amountEarned: 1000,
    },
    {
      type: 'expense',
      title: 'Курс по методике',
      dueDate: isoDate(5),
      time: '18:30',
      expense_category_uuid: categories['Обучение'].uuid,
      amountSpent: 1800,
    },
    {
      type: 'task',
      title: 'Разобрать входящие и чеки',
      dueDate: isoDate(5),
      time: '16:00',
      comments: 'Сфотографировать чеки, внести расходы.',
    },
    {
      type: 'task',
      title: 'Семейный бюджет: продукты и планы',
      dueDate: isoDate(6),
      time: '12:00',
      comments: 'Проверить баланс недели и лимиты.',
    },
    {
      type: 'expense',
      title: 'Домашние покупки',
      dueDate: isoDate(6),
      time: '13:30',
      expense_category_uuid: categories['Дом и быт'].uuid,
      amountSpent: 2450,
    },
    {
      type: 'income',
      title: 'Предоплата за следующую неделю',
      dueDate: isoDate(6),
      time: '19:15',
      amountEarned: 2000,
      comments: 'От Рустама за Тимура.',
    },
  ];

  for (const payload of taskPayloads) {
    await post('/tasks', token, payload);
  }

  for (const note of [
    {
      date: isoDate(0),
      content: 'Фокус дня: не ставить больше трех крупных дел. После первого занятия сразу закрыть оплату и заметки.',
    },
    {
      date: isoDate(2),
      content: 'Среда плотная: проверить, что между онлайн-занятием и обедом есть пауза. Вечером собрать план июня.',
    },
    {
      date: isoDate(4),
      content: 'Пятница денежная: две оплаты, материалы, вечернее планирование. Хороший день для проверки финансового блока.',
    },
    {
      date: isoDate(6),
      content: 'Воскресенье оставить мягким: только семейный бюджет, покупки и подготовка к новой неделе.',
    },
  ]) {
    await post('/notes', token, note);
  }
}

async function main() {
  const token = await ensureDemoUser();
  await clearDemoData(token);
  await seedDemoData(token);

  const [tasks, notes, categories, children] = await Promise.all([
    request('/tasks', token),
    request('/notes', token),
    request('/expense-categories', token),
    request('/children', token),
  ]);

  console.log(JSON.stringify({
    user: demoUser.email,
    children: children.length,
    categories: categories.length,
    tasks: tasks.length,
    notes: notes.length,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
