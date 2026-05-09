import * as React from 'react';
import { headers } from 'next/headers';

import { auth } from './index';

const cache =
  typeof React.cache === 'function'
    ? React.cache
    : <T extends (...args: unknown[]) => unknown>(fn: T) => fn;

export const getSession = cache(async () => {
  const requestHeaders = await headers();
  return auth.api.getSession({ headers: requestHeaders });
});

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
