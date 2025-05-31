const db = require('./db.cjs');

process.env.NODE_ENV = 'test';

console.log('Jest setup file is running: before all tests');

beforeEach(async () => {
    console.log('Running beforeEach: rolling back, migrating, and seeding database.');
    await db.migrate.rollback(null, true);
    await db.migrate.latest();
    await db.seed.run();
});

afterEach(async () => {
    console.log('Running afterEach: rolling back migrations.');
    await db.migrate.rollback(null, true);
});

afterAll(async () => {
    console.log('Running afterAll: closing database connection and server.');
    await db.destroy();
    // Добавьте здесь закрытие сервера, если он был запущен глобально
    // const { server } = require('../index.js'); // Если сервер экспортируется
    // if (server) {
    //   server.close(() => {
    //     console.log('HTTP server closed.');
    //   });
    // }
});