const knex = require('knex');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true // Указываем, что значения "null" будут использоваться по умолчанию для необязательных полей
});

(async () => {
  try {
    await db.raw('SELECT 1+1 AS result');
    console.log('Подключение к базе данных SQLite3 успешно установлено.');
  } catch (error) {
    console.error('Ошибка при подключении к базе данных SQLite3:', error);
  }
})();

module.exports = db;