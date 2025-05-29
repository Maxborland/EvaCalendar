const knex = require('knex');
const knexConfig = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]);

db.raw('SELECT 1')
  .then(() => {
    console.log('Подключение к базе данных SQLite3 успешно установлено.');
  })
  .catch((err) => {
    console.error('Ошибка подключения к базе данных:', err);
    if (process.env.NODE_ENV === 'test') { // Не вызываем exit в тестовой среде
      return;
    }
    process.exit(1);
  });

module.exports = db;