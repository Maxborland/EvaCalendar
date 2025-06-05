const db = require('./db.cjs');

process.env.NODE_ENV = 'test';

// console.log('Jest setup file is running: before all tests'); // Удалено для уменьшения логирования

beforeEach(async () => {
    // console.log('Running beforeEach: rolling back, migrating, and seeding database.'); // Удалено для уменьшения логирования
    await db.migrate.rollback(null, true);
    await db.migrate.latest();
    await db.seed.run();
});

afterEach(async () => {
    // console.log('Running afterEach: rolling back migrations.'); // Удалено для уменьшения логирования
    await db.migrate.rollback(null, true);
});

afterAll(async () => {
    // console.log('Running afterAll: closing database connection and server.'); // Удалено для уменьшения логирования
    await db.destroy();
});