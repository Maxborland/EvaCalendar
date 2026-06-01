const db = require('./db.cjs');

module.exports = async () => {
  console.log('[Jest GlobalTeardown] Starting teardown...');

  // Закрываем соединение с базой данных
  if (db && typeof db.destroy === 'function') {
    try {
      await db.destroy();
      console.log('[Jest GlobalTeardown] DB connection destroyed.');
    } catch (error) {
      console.error('[Jest GlobalTeardown] Error destroying DB connection:', error);
    }
  } else {
    console.warn('[Jest GlobalTeardown] DB instance or destroy method not available.');
  }

  console.log('[Jest GlobalTeardown] Teardown finished.');
};
