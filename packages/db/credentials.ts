import { env } from '@formbase/env';

type DatabaseCredentials = {
  url: string;
  authToken?: string;
};

export const getDatabaseCredentials = (): DatabaseCredentials => {
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl.startsWith('libsql://')) {
    return { url: databaseUrl };
  }

  if (!env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is required for libsql:// URLs');
  }

  return {
    url: databaseUrl,
    authToken: env.TURSO_AUTH_TOKEN,
  };
};
