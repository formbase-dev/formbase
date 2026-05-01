import { defineConfig } from 'drizzle-kit';

import { env } from '@formbase/env';

export default defineConfig({
  dialect: 'turso',
  schema: './schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.DATABASE_URL,
    ...(env.TURSO_AUTH_TOKEN ? { authToken: env.TURSO_AUTH_TOKEN } : {}),
  },
});
