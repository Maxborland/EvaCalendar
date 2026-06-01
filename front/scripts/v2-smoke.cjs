const fs = require('node:fs');
const { chromium } = require('playwright');
const {
  assert,
  assertMobileSurface,
  expectVisibleText,
  waitForCondition,
} = require('./v2-smoke/assertions.cjs');
const {
  emptyJson,
  mockApi,
  setupAuthedEmptyApi,
} = require('./v2-smoke/mockApi.cjs');
const {
  baseURL,
  edgePath,
  ensureServer,
} = require('./v2-smoke/server.cjs');
const {
  child,
  getToday,
  getTomorrow,
  lessonChild,
} = require('./v2-fixtures.cjs');

const runWeeklyHubSmoke = async (page, posts, updates) => {
  console.log('[v2-smoke] weekly hub');
  await page.goto(`${baseURL}/`);

  await page.getByRole('heading', { name: 'План недели' }).waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForURL(`${baseURL}/`, { timeout: 5000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
  assert(await page.locator('button[aria-label="Настройки"]').count() === 0, 'Weekly hub header should not show secondary settings action');
  assert(await page.locator('button[aria-label="Выход"]').count() === 0, 'Weekly hub header should not show secondary logout action');
  await expectVisibleText(page, 'Итог недели');
  await expectVisibleText(page, 'детей: 2');
  await expectVisibleText(page, '+2 500 ₽');
  await expectVisibleText(page, '-700 ₽');
  await expectVisibleText(page, 'Внести оплату: Боря');
  await expectVisibleText(page, 'Позвонить родителю');
  await expectVisibleText(page, 'Занятие: Боря');

  const gridColumns = await page.locator('section[aria-label="План недели"]').evaluate((node) => {
    return window.getComputedStyle(node).gridTemplateColumns.split(' ').length;
  });
  assert(gridColumns === 2, `Expected two-column weekly grid, got ${gridColumns}`);
  assert(await page.locator('button[aria-label="План"]').getAttribute('aria-current') === 'page', 'Plan nav item is not active');
  await page.locator('button[aria-label="Деньги"]').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('button[aria-label="Дети"]').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('button[aria-label="Задачи"]').waitFor({ state: 'visible', timeout: 5000 });

  const closeTaskBox = await page.locator('section[aria-label="Фокус дня"] button[aria-label="Закрыть задачу"]').boundingBox();
  assert(closeTaskBox && closeTaskBox.width >= 44 && closeTaskBox.height >= 44, `Weekly close-task tap target is too small: ${JSON.stringify(closeTaskBox)}`);

  await page.locator('section[aria-label="Фокус дня"]').getByRole('button', { name: /Доход/ }).first().click();
  await expectVisibleText(page, 'Новый доход');
  assert(page.url() === `${baseURL}/`, `Weekly unpaid lesson income changed URL to ${page.url()}`);
  assert(await page.locator('#child-input').inputValue() === lessonChild.childName, 'Weekly unpaid lesson income did not preserve lesson child');
  assert(await page.locator('#amount').inputValue() === String(lessonChild.hourlyRate), 'Weekly unpaid lesson income did not prefill amount from rate');
  await page.getByRole('button', { name: 'Создать доход' }).click();
  await page.getByText('Новый доход').waitFor({ state: 'hidden', timeout: 5000 });
  assert(posts.some(post => post.type === 'income' && post.child_uuid === lessonChild.uuid && post.amount === lessonChild.hourlyRate), 'Weekly unpaid lesson income payload is missing or invalid');

  const updatesBeforeClose = updates.length;
  await page.locator('section[aria-label="Фокус дня"] button[aria-label="Закрыть задачу"]').click();
  await waitForCondition(
    () => updates.length > updatesBeforeClose && updates.some(update => update.completed === true),
    'Weekly hub task completion did not send completed=true',
  );
};

const runLocalCreateSmoke = async (page, posts) => {
  console.log('[v2-smoke] local create');
  await page.goto(`${baseURL}/children`);
  await page.locator('article').filter({ hasText: child.childName }).first().getByRole('button', { name: /Доход/ }).click();
  await expectVisibleText(page, 'Новый доход');
  assert(page.url().endsWith('/children'), `Children create changed URL to ${page.url()}`);
  assert(await page.locator('#child-input').inputValue() === child.childName, 'Child income did not preserve selected child');
  assert(await page.locator('#amount').inputValue() === '2500', 'Child income did not prefill amount from rate');
  await page.getByRole('button', { name: 'Создать доход' }).click();
  await page.getByText('Новый доход').waitFor({ state: 'hidden', timeout: 5000 });
  assert(page.url().endsWith('/children'), `Children submit changed URL to ${page.url()}`);

  await page.goto(`${baseURL}/money`);
  await page.getByRole('button', { name: /Расход/ }).first().click();
  await expectVisibleText(page, 'Новый расход');
  assert(page.url().endsWith('/money'), `Money create changed URL to ${page.url()}`);
  await page.locator('#amount').fill('1200');
  await page.getByRole('button', { name: 'Создать расход' }).click();
  await page.getByText('Новый расход').waitFor({ state: 'hidden', timeout: 5000 });
  assert(page.url().endsWith('/money'), `Money submit changed URL to ${page.url()}`);

  await page.goto(`${baseURL}/tasks`);
  await page.getByRole('button', { name: /На завтра/ }).click();
  await expectVisibleText(page, 'Новая задача');
  assert(page.url().endsWith('/tasks'), `Tasks create changed URL to ${page.url()}`);
  await page.locator('#title').fill('Позвонить родителю');
  await page.getByRole('button', { name: 'Создать задачу' }).click();
  await page.getByText('Новая задача').waitFor({ state: 'hidden', timeout: 5000 });
  assert(page.url().endsWith('/tasks'), `Tasks submit changed URL to ${page.url()}`);

  assert(posts.some(post => post.type === 'income' && post.child_uuid === child.uuid && post.amount === 2500 && post.hoursWorked === 1), 'Income payload is missing or invalid');
  assert(posts.some(post => post.type === 'expense' && post.amount === 1200), 'Expense payload is missing or invalid');
  assert(posts.some(post => post.type === 'task' && post.title === 'Позвонить родителю' && post.dueDate === getTomorrow()), 'Task payload is missing or invalid');
};

const runDayDrillDownSmoke = async (page, posts, updates) => {
  console.log('[v2-smoke] day drill-down');
  await page.goto(`${baseURL}/day/${getToday()}`);

  await expectVisibleText(page, 'Итог дня');
  await expectVisibleText(page, '+1 800 ₽');
  await expectVisibleText(page, '+2 500 ₽');
  await expectVisibleText(page, '-700 ₽');
  await expectVisibleText(page, 'Позвонить родителю');
  await expectVisibleText(page, 'План дня');

  await page.locator('button[aria-label="Закрыть задачу"]').first().click();
  await waitForCondition(
    () => updates.some(update => update.completed === true),
    'Day task completion did not send completed=true',
  );

  const postsBeforeDayIncome = posts.length;
  await page.locator('main button').filter({ hasText: 'Доход' }).first().click();
  await expectVisibleText(page, 'Новый доход');
  assert(page.url().endsWith(`/day/${getToday()}`), `Day income create changed URL to ${page.url()}`);
  assert(await page.locator('#child-input').inputValue() === lessonChild.childName, 'Day lesson income did not preserve lesson child');
  assert(await page.locator('#amount').inputValue() === String(lessonChild.hourlyRate), 'Day lesson income did not prefill amount from rate');
  await page.getByRole('button', { name: 'Создать доход' }).click();
  await page.getByText('Новый доход').waitFor({ state: 'hidden', timeout: 5000 });
  assert(page.url().endsWith(`/day/${getToday()}`), `Day income submit changed URL to ${page.url()}`);
  assert(
    posts.slice(postsBeforeDayIncome).some(post => post.type === 'income' && post.child_uuid === lessonChild.uuid && post.amount === lessonChild.hourlyRate && post.dueDate === getToday()),
    'Day lesson income payload is missing or invalid',
  );
};

const runMoneyEmptyStateSmoke = async (browser) => {
  console.log('[v2-smoke] money empty state');

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('token', 'v2-smoke-token');
    localStorage.setItem('isSubscribed', 'true');
  });

  await page.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/users/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ uuid: 'u1', username: 'demo', email: 'demo@example.com', role: 'user' }),
  }));
  await page.route('**/api/subscriptions/status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ isSubscribed: true }),
  }));
  await page.route('**/api/children**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/tasks', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/tasks/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/summary/daily-breakdown**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/summary/category-breakdown**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));

  await page.goto(`${baseURL}/money`);
  assert(await page.getByRole('button', { name: 'Неделя' }).getAttribute('aria-pressed') === 'true', 'Money page should default to week period');
  await expectVisibleText(page, 'Движения денег за период нет');
  await expectVisibleText(page, 'Доходов по детям пока нет');
  await expectVisibleText(page, 'Операций за период нет');

  await page.getByRole('button', { name: /Добавить первую операцию/ }).click();
  await expectVisibleText(page, 'Новый доход');
  assert(page.url().endsWith('/money'), `Money empty-state create changed URL to ${page.url()}`);
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await page.getByText('Новый доход').waitFor({ state: 'hidden', timeout: 5000 });

  await page.getByRole('button', { name: /Доходов по детям пока нет/ }).click();
  await page.waitForURL(`${baseURL}/children`, { timeout: 5000 });
  await context.close();
};

const runChildrenEmptyStateSmoke = async (browser) => {
  console.log('[v2-smoke] children empty state');

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('token', 'v2-smoke-token');
    localStorage.setItem('isSubscribed', 'true');
  });

  await page.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/users/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ uuid: 'u1', username: 'demo', email: 'demo@example.com', role: 'user' }),
  }));
  await page.route('**/api/subscriptions/status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ isSubscribed: true }),
  }));
  await page.route('**/api/children**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/tasks', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/tasks/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));

  await page.goto(`${baseURL}/children`);
  await expectVisibleText(page, 'Добавьте первого ребенка');
  await expectVisibleText(page, 'Карточка хранит ставку и контакт');
  await page.getByRole('button', { name: /Создать карточку/ }).click();
  await page.waitForURL(`${baseURL}/settings/child-cards`, { timeout: 5000 });
  await context.close();
};

const runTasksEmptyStateSmoke = async (browser) => {
  console.log('[v2-smoke] tasks empty state');

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('token', 'v2-smoke-token');
    localStorage.setItem('isSubscribed', 'true');
  });

  await page.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/users/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ uuid: 'u1', username: 'demo', email: 'demo@example.com', role: 'user' }),
  }));
  await page.route('**/api/subscriptions/status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ isSubscribed: true }),
  }));
  await page.route('**/api/children**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/tasks', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await page.route('**/api/tasks/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));

  await page.goto(`${baseURL}/tasks`);
  await expectVisibleText(page, 'Список задач пуст');
  await expectVisibleText(page, 'Добавьте первое дело на сегодня или завтра');

  await page.getByRole('button', { name: /На сегодня/ }).last().click();
  await expectVisibleText(page, 'Новая задача');
  assert(page.url().endsWith('/tasks'), `Tasks empty-state create changed URL to ${page.url()}`);
  assert(await page.locator('#dueDate').inputValue() === getToday(), 'Tasks empty-state create did not prefill today');
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await page.getByText('Новая задача').waitFor({ state: 'hidden', timeout: 5000 });

  await page.getByRole('button', { name: /Открыть план недели/ }).click();
  await page.waitForURL(`${baseURL}/`, { timeout: 5000 });
  await context.close();
};

const runEmptyDayQuickActionsSmoke = async (browser) => {
  console.log('[v2-smoke] empty day quick actions');

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  await mockApi(page, [], []);

  const targetDate = getTomorrow();
  const checks = [
    { label: 'доход', title: 'Новый доход' },
    { label: 'расход', title: 'Новый расход' },
    { label: 'задача', title: 'Новая задача' },
  ];

  await page.goto(`${baseURL}/`);
  await expectVisibleText(page, 'План недели');

  for (const check of checks) {
    await page.getByRole('button', { name: `Добавить ${check.label} на ${targetDate}` }).click();
    await expectVisibleText(page, check.title);
    assert(page.url() === `${baseURL}/`, `Empty day ${check.label} create changed URL to ${page.url()}`);
    assert(await page.locator('#dueDate').inputValue() === targetDate, `Empty day ${check.label} did not prefill ${targetDate}`);
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await page.getByText(check.title).waitFor({ state: 'hidden', timeout: 5000 });
  }

  await context.close();
};

const runCoreErrorStateSmoke = async (browser) => {
  console.log('[v2-smoke] core error states');

  const checks = [
    {
      path: '/',
      errorRoutes: ['**/api/tasks', '**/api/tasks/**'],
      text: 'Не удалось загрузить неделю',
    },
    {
      path: '/money',
      errorRoutes: ['**/api/tasks', '**/api/tasks/**', '**/api/summary/daily-breakdown**', '**/api/summary/category-breakdown**'],
      text: 'Не удалось обновить деньги',
    },
    {
      path: '/children',
      errorRoutes: ['**/api/children**'],
      text: 'Не удалось загрузить детей',
    },
    {
      path: '/tasks',
      errorRoutes: ['**/api/tasks', '**/api/tasks/**'],
      text: 'Не удалось загрузить задачи',
    },
  ];

  for (const check of checks) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await setupAuthedEmptyApi(page);

    for (const errorRoute of check.errorRoutes) {
      await page.route(errorRoute, route => route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'v2 smoke forced error' }),
      }));
    }

    await page.goto(`${baseURL}${check.path}`);
    await expectVisibleText(page, check.text);
    await assertMobileSurface(page, `${check.path} error state`);
    await context.close();
  }
};

const runCoreMobileAudit = async (browser) => {
  console.log('[v2-smoke] core mobile audit');

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  await mockApi(page, [], []);

  const checks = [
    { path: '/', text: 'План недели' },
    { path: '/money', text: 'Деньги' },
    { path: '/children', text: 'Дети' },
    { path: '/tasks', text: 'Задачи' },
  ];

  for (const check of checks) {
    await page.goto(`${baseURL}${check.path}`);
    await expectVisibleText(page, check.text);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
    await assertMobileSurface(page, `${check.path} happy state`);
  }

  await context.close();
};

const main = async () => {
  const server = await ensureServer();
  const posts = [];
  const updates = [];
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(edgePath) ? edgePath : undefined,
    channel: fs.existsSync(edgePath) ? undefined : 'msedge',
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await mockApi(page, posts, updates);

    await runWeeklyHubSmoke(page, posts, updates);
    await runDayDrillDownSmoke(page, posts, updates);
    await runLocalCreateSmoke(page, posts);
    await runMoneyEmptyStateSmoke(browser);
    await runChildrenEmptyStateSmoke(browser);
    await runTasksEmptyStateSmoke(browser);
    await runEmptyDayQuickActionsSmoke(browser);
    await runCoreErrorStateSmoke(browser);
    await runCoreMobileAudit(browser);

    console.log(JSON.stringify({ ok: true, checks: ['weekly-hub', 'day-drill-down', 'local-create', 'money-empty-state', 'children-empty-state', 'tasks-empty-state', 'empty-day-quick-actions', 'core-error-states', 'core-mobile-audit'], posts, updates }, null, 2));
  } finally {
    await browser.close();
    if (server) server.kill();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
