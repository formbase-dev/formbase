import { getCloudflareContext } from '@opennextjs/cloudflare';

import {
  buildWebhookPayload,
  createDeliveryLogRow,
} from '@formbase/api/lib/webhook';
import { db, drizzlePrimitives } from '@formbase/db';
import { forms } from '@formbase/db/schema';

const { eq } = drizzlePrimitives;

export async function enqueueWebhook({
  formId,
  formDataId,
}: {
  formId: string;
  formDataId: string;
}): Promise<string | null> {
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    columns: { enableWebhook: true, webhookUrl: true },
  });
  if (!form?.enableWebhook || !form.webhookUrl) return null;

  const webhookUrl = form.webhookUrl;

  const payload = await buildWebhookPayload(db, formId, formDataId);
  if (!payload) return null;

  const deliveryLogId = await createDeliveryLogRow(db, {
    formId,
    formDataId,
    webhookUrl,
    payload,
  });

  const { WEBHOOK_QUEUE: queue } = getCloudflareContext().env;
  await queue.send({ deliveryLogId, webhookUrl });
  return deliveryLogId;
}
