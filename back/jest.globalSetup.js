const db = require('./db.cjs');

module.exports = async () => {
  await db.migrate.latest();
  await db.seed.run();
  // db.destroy() будет вызван в globalTeardown
};