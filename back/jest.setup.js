require('dotenv').config({ path: require('path').resolve(__dirname, '.env') }); // Явно указываем путь к .env
process.env.NODE_ENV = 'test'; // Должно быть установлено ПЕРЕД импортом db
const db = require('./db.cjs'); // Теперь db будет использовать тестовую конфигурацию из knexfile.cjs

console.log(`[Jest Setup] Initialized. NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Jest Setup] JWT_SECRET from env: ${process.env.JWT_SECRET ? 'Loaded (not empty)' : 'NOT LOADED or EMPTY'}`); // Логируем состояние JWT_SECRET
if (db && db.client && db.client.config) {
  console.log(`[Jest Setup] Knex client: ${db.client.config.client}`);
  console.log(`[Jest Setup] Knex connection: ${JSON.stringify(db.client.config.connection)}`);
} else {
  console.error('[Jest Setup] CRITICAL: db or db.client.config is not defined!');
}

beforeAll(async () => { // Изменено с beforeEach на beforeAll
    console.log('[Jest Setup - beforeAll] Starting for new test file...');
    try {
        console.log('[Jest Setup - beforeAll] Applying latest migrations...');
        await db.migrate.latest();
        console.log('[Jest Setup - beforeAll] Latest migrations applied.');
    } catch (err) {
        console.error('[Jest Setup - beforeAll] Migrate latest FAILED:', err.message, err.stack);
        throw err;
    }

    try {
        console.log('[Jest Setup - beforeAll] Seeding data...');
        await db.seed.run();
        console.log('[Jest Setup - beforeAll] Seeding successful.');
    } catch (err) {
        console.error('[Jest Setup - beforeAll] Seeding FAILED:', err.message, err.stack);
        throw err;
    }
    console.log('[Jest Setup - beforeAll] Finished for new test file.');
});

afterEach(async () => {
    console.log('[Jest Setup - afterEach] Cleaning up database...');
    const tables = ['tasks', 'children', 'expense_categories', 'notes', 'password_reset_tokens', 'token_blacklist', 'users'];
    for (const table of tables) {
        await db(table).del();
    }
    console.log('[Jest Setup - afterEach] Database cleaned up.');
});

afterAll(async () => { // Этот afterAll будет выполняться после всех тестов в файле
    console.log('[Jest Setup - afterAll] Destroying db connection for test file...');
    if (db && typeof db.destroy === 'function') {
        await db.destroy();
        console.log('[Jest Setup - afterAll] DB connection destroyed.');
    } else {
        console.warn('[Jest Setup - afterAll] db.destroy is not a function or db is not defined.');
    }
});