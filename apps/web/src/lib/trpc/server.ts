import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';

import { getCloudflareContext } from '@opennextjs/cloudflare';

import { createCaller, createTRPCContext } from '@formbase/api';

const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');

  return createTRPCContext({
    headers: heads,
    webhookQueue: getCloudflareContext().env.WEBHOOK_QUEUE,
  });
});

export const api = createCaller(createContext);
