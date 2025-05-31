const db = require('./db.cjs');

module.exports = async () => {
  await db.migrate.rollback(null, true); // Откатываем все миграции
  await db.destroy(); // Закрываем соединение с базой данных
};