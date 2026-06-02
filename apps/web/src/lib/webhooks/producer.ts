import type { WebhookQueue } from '@formbase/api/lib/webhook';

import { db } from '@formbase/db';
import {
  buildWebhookPayload,
  createDeliveryLogRow,
} from '@formbase/api/lib/webhook';

export async function enqueueWebhook(
  queue: WebhookQueue,
  {
    formId,
    formDataId,
    webhookUrl,
  }: { formId: string; formDataId: string; webhookUrl: string },
): Promise<string | null> {
  const payload = await buildWebhookPayload(db, formId, formDataId);
  if (!payload) return null;

  const deliveryLogId = await createDeliveryLogRow(db, {
    formId,
    formDataId,
    webhookUrl,
    payload,
  });

  await queue.send({ deliveryLogId, webhookUrl });
  return deliveryLogId;
}
