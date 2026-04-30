import type { db as database } from '@formbase/db';

import { drizzlePrimitives } from '@formbase/db';
import { apiKeys } from '@formbase/db/schema';

import { hashApiKey } from '../lib/api-key';

const { and, eq, gt, isNull, or } = drizzlePrimitives;

type Database = typeof database;
type AfterResponse = (task: () => Promise<void> | void) => void;

export async function validateApiKey(
  authorization: string | null | undefined,
  db: Database,
  afterResponse?: AfterResponse,
) {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice(7);
  const keyHash = hashApiKey(token);

  const apiKey = await db.query.apiKeys.findFirst({
    where: (table) =>
      and(
        eq(table.keyHash, keyHash),
        or(isNull(table.expiresAt), gt(table.expiresAt, new Date())),
      ),
    with: { user: true },
  });

  if (apiKey) {
    const updateLastUsedAt = async () => {
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, apiKey.id))
        .catch(() => undefined);
    };

    if (afterResponse) {
      afterResponse(updateLastUsedAt);
    } else {
      void updateLastUsedAt();
    }
  }

  return apiKey;
}
