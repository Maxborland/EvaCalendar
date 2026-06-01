require('dotenv').config({ path: require('path').resolve(__dirname, '.env') }); // Явно указываем путь к .env
const fs = require('fs');
const path = require('path');
process.env.NODE_ENV = 'test'; // Должно быть установлено ПЕРЕД импортом db

if (process.env.JEST_SKIP_DB_SETUP === '1') {
    console.log('[Jest Setup] Skipping DB migrate/seed for focused unit tests.');
} else {
    const db = require('./db.cjs'); // Теперь db будет использовать тестовую конфигурацию из knexfile.cjs

    console.log(`[Jest Setup] Initialized. NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[Jest Setup] JWT_SECRET from env: ${process.env.JWT_SECRET ? 'Loaded (not empty)' : 'NOT LOADED or EMPTY'}`); // Логируем состояние JWT_SECRET
    if (db && db.client && db.client.config) {
      console.log(`[Jest Setup] Knex client: ${db.client.config.client}`);
      console.log(`[Jest Setup] Knex connection: ${JSON.stringify(db.client.config.connection)}`);
    } else {
      console.error('[Jest Setup] CRITICAL: db or db.client.config is not defined!');
    }

    beforeAll(async () => {
    console.log('[Jest Setup - beforeAll] Starting for new test file...');
    try {
        console.log('[Jest Setup - beforeAll] Rolling back migrations...');
        await db.migrate.rollback(undefined, true);
        console.log('[Jest Setup - beforeAll] Applying latest migrations...');
        await db.migrate.latest();
        console.log('[Jest Setup - beforeAll] Latest migrations applied.');
    } catch (err) {
        console.error('[Jest Setup - beforeAll] Migrate latest FAILED:', err.message, err.stack);
        throw err;
    }

    const seedsDirectory = path.resolve(__dirname, 'seeds');
    if (fs.existsSync(seedsDirectory)) {
        try {
            console.log('[Jest Setup - beforeAll] Seeding data...');
            await db.seed.run();
            console.log('[Jest Setup - beforeAll] Seeding successful.');
        } catch (err) {
            console.error('[Jest Setup - beforeAll] Seeding FAILED:', err.message, err.stack);
            throw err;
        }
    } else {
        console.log('[Jest Setup - beforeAll] No seeds directory found, skipping seed run.');
    }
    console.log('[Jest Setup - beforeAll] Finished for new test file.');
    });

    afterAll(async () => { // Изменено на afterAll
    console.log('[Jest Setup - afterAll] Cleaning up database...');
    // Теперь очистка не нужна, так как мы делаем rollback в beforeAll
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
}
