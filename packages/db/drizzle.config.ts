import type { Config } from 'drizzle-kit';

import { env } from '@formbase/env';

export default {
  dialect: 'sqlite',
  driver: 'turso',
  schema: './schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.DATABASE_URL,
    ...(env.TURSO_AUTH_TOKEN ? { authToken: env.TURSO_AUTH_TOKEN } : {}),
  },
} satisfies Config;
