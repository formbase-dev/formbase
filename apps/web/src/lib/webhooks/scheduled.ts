import type { WebhookQueue } from '@formbase/api/lib/webhook';

import { db } from '@formbase/db';
import {
  cleanupOldWebhookLogs,
  findStuckDeliveries,
} from '@formbase/api/lib/webhook';

async function sweepStuckWebhooks(queue: WebhookQueue): Promise<void> {
  const stuck = await findStuckDeliveries(db, {
    olderThanMs: 120000,
    leaseMs: 900000,
  });
  if (stuck.length) {
    await queue.sendBatch(
      stuck.map((s) => ({
        body: { deliveryLogId: s.id, webhookUrl: s.webhookUrl },
      })),
    );
  }
}

export async function handleScheduled(
  controller: { cron: string },
  env: { WEBHOOK_QUEUE: WebhookQueue },
  _ctx: unknown,
): Promise<void> {
  switch (controller.cron) {
    case '*/5 * * * *':
      await sweepStuckWebhooks(env.WEBHOOK_QUEUE);
      break;
    case '0 3 * * *':
      await cleanupOldWebhookLogs(db);
      break;
  }
}
