import { afterAll, afterEach, beforeAll } from 'vitest';

import {
  resetDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from './helpers/db';

process.env['SKIP_ENV_VALIDATION'] = 'true';
process.env.NODE_ENV = 'test';
process.env['DATABASE_URL'] = 'file::memory:?cache=shared';
process.env['BETTER_AUTH_SECRET'] =
  'test-secret-minimum-32-characters-long-for-testing';
process.env['ALLOW_SIGNIN_SIGNUP'] = 'true';

beforeAll(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});
