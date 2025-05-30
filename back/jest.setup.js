import db from './db.cjs';
import { server } from './index.js';

process.env.NODE_ENV = 'test';

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.migrate.rollback();
  await db.destroy();
  return new Promise(resolve => server.close(resolve));
});