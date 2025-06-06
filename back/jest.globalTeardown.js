const db = require('./db.cjs');
const { server } = require('./index'); // Импортируем сервер

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

  // Закрываем HTTP сервер
  if (server && typeof server.close === 'function') {
    try {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            console.error('[Jest GlobalTeardown] Error closing HTTP server:', err);
            return reject(err);
          }
          console.log('[Jest GlobalTeardown] HTTP server closed.');
          resolve();
        });
      });
    } catch (error) {
      // Ошибка уже залогирована внутри промиса
    }
  } else {
    console.warn('[Jest GlobalTeardown] HTTP server instance or close method not available.');
  }
  console.log('[Jest GlobalTeardown] Teardown finished.');
};