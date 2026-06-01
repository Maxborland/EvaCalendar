const {
  buildTasks,
  child,
  getToday,
  lessonChild,
  moneyCategory,
} = require('../v2-fixtures.cjs');

const emptyJson = JSON.stringify([]);

const setupAuthStorage = async (page) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'v2-smoke-token');
    localStorage.setItem('isSubscribed', 'true');
  });
};

const routeAuthedUser = async (page) => {
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
};

const setupAuthedEmptyApi = async (page) => {
  await setupAuthStorage(page);
  await page.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: emptyJson }));
  await routeAuthedUser(page);
};

const mockApi = async (page, posts, updates = []) => {
  await setupAuthStorage(page);

  await page.route('**/api/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: emptyJson,
  }));

  await routeAuthedUser(page);

  await page.route('**/api/children**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([child, lessonChild]),
  }));

  await page.route('**/api/expense-categories**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([moneyCategory]),
  }));

  await page.route('**/api/summary/daily-breakdown**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ date: getToday(), totalIncome: 2500, totalExpenses: 700 }]),
  }));

  await page.route('**/api/summary/category-breakdown**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ categoryName: moneyCategory.categoryName, totalSpent: 700 }]),
  }));

  await page.route('**/api/notes**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: emptyJson,
  }));

  const handleTasksRoute = async (route) => {
    if (route.request().method() === 'POST') {
      const payload = JSON.parse(route.request().postData() || '{}');
      posts.push(payload);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ uuid: `created-${posts.length}`, ...payload }),
      });
    }

    if (route.request().method() === 'PUT') {
      const payload = JSON.parse(route.request().postData() || '{}');
      updates.push(payload);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ uuid: 'updated-task', ...payload }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildTasks()),
    });
  };

  await page.route('**/api/tasks', handleTasksRoute);
  await page.route('**/api/tasks/**', handleTasksRoute);
};

module.exports = {
  emptyJson,
  mockApi,
  setupAuthedEmptyApi,
};
