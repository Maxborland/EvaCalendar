const knex = require('knex');
const knexfile = require('./knexfile.cjs');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

db.raw('SELECT 1')
  .then(() => {
  })
  .catch((err) => {
    console.error('Ошибка подключения к базе данных:', err);
    if (process.env.NODE_ENV === 'test') { // Не вызываем exit в тестовой среде
      return;
    }
    process.exit(1);
  });

module.exports = db;