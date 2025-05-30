/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js'], // Добавляем эту строку
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [], // Добавляем эту строку
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node', 'cjs'],
};

export default config;