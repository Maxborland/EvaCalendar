// const db = require('./db.cjs'); // Больше не требуется здесь

module.exports = async () => {
  // Инициализация БД перенесена в jest.setup.js (beforeEach)
  // для использования in-memory БД для каждого тестового файла.
  // console.log('Global setup: Database initialization is now handled in jest.setup.js beforeEach');
};