import type {
  WebhookPayload,
  WebhookQueueMessage,
} from '@formbase/api/lib/webhook';

import { db } from '@formbase/db';
import {
  getDeliveryLog,
  getWebhookSecret,
  markFailed,
  markPending,
  markSuccess,
} from '@formbase/api/lib/webhook';

import { deliverWebhook } from './deliver';

const BACKOFF_S = [60, 600, 3600, 21600, 43200];

type WebhookMessage = {
  body: WebhookQueueMessage;
  attempts: number;
  ack(): void;
  retry(opts?: { delaySeconds?: number }): void;
};

export async function handleWebhookBatch(
  batch: { queue: string; messages: WebhookMessage[] },
  _env: unknown,
  _ctx: unknown,
): Promise<void> {
  if (batch.queue.endsWith('-dlq')) {
    for (const msg of batch.messages) {
      try {
        await markFailed(db, msg.body.deliveryLogId, {
          error: 'Exhausted retries (moved to DLQ)',
        });
      } catch (error) {
        console.error('Failed to mark webhook delivery as failed', error);
      } finally {
        msg.ack();
      }
    }
    return;
  }

  for (const msg of batch.messages) {
    const { deliveryLogId } = msg.body;
    try {
      const log = await getDeliveryLog(db, deliveryLogId);
      if (!log || log.status === 'success') {
        msg.ack();
        continue;
      }

      const secret = await getWebhookSecret(db, log.formId);
      const result = await deliverWebhook({
        webhookUrl: log.webhookUrl,
        payload: JSON.parse(log.payload) as WebhookPayload,
        secret,
      });
      const attempt = msg.attempts;

      if (result.success) {
        await markSuccess(db, deliveryLogId, {
          statusCode: result.statusCode ?? 0,
          ...(result.body !== undefined && { body: result.body }),
        });
        msg.ack();
      } else {
        const delay =
          BACKOFF_S[Math.min(attempt - 1, BACKOFF_S.length - 1)] ?? 60;
        await markPending(
          db,
          deliveryLogId,
          result,
          new Date(Date.now() + delay * 1000),
        );
        msg.retry({ delaySeconds: delay });
      }
    } catch {
      const attempt = msg.attempts;
      const delay =
        BACKOFF_S[Math.min(attempt - 1, BACKOFF_S.length - 1)] ?? 60;
      msg.retry({ delaySeconds: delay });
    }
  }
}
