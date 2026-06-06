import { describe, expect, it } from 'vitest';

import {
  buildMockPayload,
  findStuckDeliveries,
} from '@formbase/api/lib/webhook';
import { webhookDeliveryLogs } from '@formbase/db/schema';
import { generateId } from '@formbase/utils/generate-id';

import { createTestForm, createTestUser, getTestDb } from '../helpers';

describe('Webhook helpers', () => {
  it('leases at most the requested stuck deliveries', async () => {
    const db = getTestDb();
    const user = await createTestUser({
      email: 'webhook-helper@example.com',
      password: 'Password123!',
    });
    const form = await createTestForm({
      userId: user.id,
      title: 'Webhook Form',
    });
    const payload = JSON.stringify(buildMockPayload(form));
    const createdAt = new Date(Date.now() - 10000);

    await db.insert(webhookDeliveryLogs).values(
      Array.from({ length: 101 }, () => ({
        id: generateId(15),
        formId: form.id,
        webhookUrl: 'https://example.com/webhook',
        payload,
        status: 'pending' as const,
        attempts: 0,
        createdAt,
      })),
    );

    const leased = await findStuckDeliveries(db, {
      olderThanMs: 1000,
      leaseMs: 60000,
      limit: 100,
    });

    const rows = await db.query.webhookDeliveryLogs.findMany({
      columns: { nextRetryAt: true },
    });

    expect(leased).toHaveLength(100);
    expect(rows.filter((row) => row.nextRetryAt !== null)).toHaveLength(100);
  });
});
