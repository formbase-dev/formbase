import { defineConfig } from 'drizzle-kit';

import { getDatabaseCredentials } from './credentials';

export default defineConfig({
  dialect: 'turso',
  schema: './schema/index.ts',
  out: './drizzle',
  dbCredentials: getDatabaseCredentials(),
});
