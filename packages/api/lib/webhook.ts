import type { db as database } from '@formbase/db';
import type { WebhookDeliveryLog } from '@formbase/db/schema';

import { drizzlePrimitives } from '@formbase/db';
import { formDatas, forms, webhookDeliveryLogs } from '@formbase/db/schema';
import { generateId } from '@formbase/utils/generate-id';

import { parseJsonObject } from '../utils/json';

type Database = typeof database;

const { and, eq, isNull, lt, or, sql } = drizzlePrimitives;

export const SUBMISSION_CREATED = 'submission.created';

export interface WebhookPayload {
  event: 'submission.created';
  payload: {
    id: string;
    formId: string;
    formTitle: string;
    data: Record<string, unknown>;
    fileUrls: string[];
    isSpam: boolean;
    spamReason: string | null;
    createdAt: string;
  };
}

export interface WebhookQueueMessage {
  deliveryLogId: string;
  webhookUrl: string;
}

export interface WebhookQueue {
  send(message: WebhookQueueMessage): Promise<unknown>;
  sendBatch(messages: Array<{ body: WebhookQueueMessage }>): Promise<unknown>;
}

function truncate(value: string | undefined): string | null {
  if (value === undefined) return null;
  return value.slice(0, 10000);
}

export async function buildWebhookPayload(
  db: Database,
  formId: string,
  formDataId: string,
): Promise<WebhookPayload | null> {
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    columns: { id: true, title: true },
  });

  if (!form) return null;

  const submission = await db.query.formDatas.findFirst({
    where: eq(formDatas.id, formDataId),
    columns: {
      id: true,
      data: true,
      isSpam: true,
      spamReason: true,
      createdAt: true,
    },
  });

  if (!submission) return null;

  const data = parseJsonObject(submission.data) ?? {};
  const fileUrls = Object.values(data).filter(
    (value): value is string =>
      typeof value === 'string' && value.startsWith('http'),
  );

  return {
    event: SUBMISSION_CREATED,
    payload: {
      id: submission.id,
      formId: form.id,
      formTitle: form.title,
      data,
      fileUrls,
      isSpam: submission.isSpam,
      spamReason: submission.spamReason,
      createdAt: submission.createdAt.toISOString(),
    },
  };
}

export function buildMockPayload(form: {
  id: string;
  title: string;
}): WebhookPayload {
  return {
    event: SUBMISSION_CREATED,
    payload: {
      id: `test_${generateId(10)}`,
      formId: form.id,
      formTitle: form.title,
      data: { message: 'This is a test webhook from formbase' },
      fileUrls: [],
      isSpam: false,
      spamReason: null,
      createdAt: new Date().toISOString(),
    },
  };
}

export async function createDeliveryLogRow(
  db: Database,
  {
    formId,
    formDataId,
    webhookUrl,
    payload,
  }: {
    formId: string;
    formDataId: string | null;
    webhookUrl: string;
    payload: WebhookPayload;
  },
): Promise<string> {
  const id = generateId(15);
  await db.insert(webhookDeliveryLogs).values({
    id,
    formId,
    formDataId,
    webhookUrl,
    payload: JSON.stringify(payload),
    status: 'pending',
    attempts: 0,
  });
  return id;
}

export async function getDeliveryLog(
  db: Database,
  id: string,
): Promise<WebhookDeliveryLog | undefined> {
  return db.query.webhookDeliveryLogs.findFirst({
    where: eq(webhookDeliveryLogs.id, id),
  });
}

export async function getWebhookSecret(
  db: Database,
  formId: string,
): Promise<string | null> {
  const form = await db.query.forms.findFirst({
    where: eq(forms.id, formId),
    columns: { webhookSecret: true },
  });
  return form?.webhookSecret ?? null;
}

export async function markSuccess(
  db: Database,
  id: string,
  { statusCode, body }: { statusCode: number; body?: string },
) {
  await db
    .update(webhookDeliveryLogs)
    .set({
      status: 'success',
      statusCode,
      responseBody: truncate(body),
      completedAt: new Date(),
      attempts: sql`${webhookDeliveryLogs.attempts} + 1`,
    })
    .where(eq(webhookDeliveryLogs.id, id));
}

export async function markPending(
  db: Database,
  id: string,
  result: { statusCode?: number; body?: string; error?: string },
  nextRetryAt: Date,
) {
  await db
    .update(webhookDeliveryLogs)
    .set({
      status: 'pending',
      statusCode: result.statusCode ?? null,
      responseBody: truncate(result.body),
      errorMessage: result.error ?? null,
      nextRetryAt,
      attempts: sql`${webhookDeliveryLogs.attempts} + 1`,
    })
    .where(eq(webhookDeliveryLogs.id, id));
}

export async function markFailed(
  db: Database,
  id: string,
  result: { statusCode?: number; body?: string; error?: string },
) {
  await db
    .update(webhookDeliveryLogs)
    .set({
      status: 'failed',
      statusCode: result.statusCode ?? null,
      responseBody: truncate(result.body),
      errorMessage: result.error ?? null,
      completedAt: new Date(),
      attempts: sql`${webhookDeliveryLogs.attempts} + 1`,
    })
    .where(eq(webhookDeliveryLogs.id, id));
}

export async function findStuckDeliveries(
  db: Database,
  { olderThanMs, leaseMs }: { olderThanMs: number; leaseMs: number },
): Promise<Array<{ id: string; webhookUrl: string }>> {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - leaseMs);
  const nextRetryAt = new Date(now.getTime() + leaseMs);
  return db
    .update(webhookDeliveryLogs)
    .set({ nextRetryAt })
    .where(
      and(
        eq(webhookDeliveryLogs.status, 'pending'),
        lt(webhookDeliveryLogs.attempts, 5),
        or(
          isNull(webhookDeliveryLogs.nextRetryAt),
          lt(webhookDeliveryLogs.nextRetryAt, staleBefore),
        ),
        lt(
          webhookDeliveryLogs.createdAt,
          new Date(now.getTime() - olderThanMs),
        ),
      ),
    )
    .returning({
      id: webhookDeliveryLogs.id,
      webhookUrl: webhookDeliveryLogs.webhookUrl,
    });
}

export async function cleanupOldWebhookLogs(db: Database) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await db
    .delete(webhookDeliveryLogs)
    .where(
      and(
        drizzlePrimitives.inArray(webhookDeliveryLogs.status, [
          'success',
          'failed',
        ]),
        lt(webhookDeliveryLogs.createdAt, ninetyDaysAgo),
      ),
    );
}

export async function listWebhookDeliveries(
  db: Database,
  formId: string,
  limit = 20,
) {
  return db
    .select({
      id: webhookDeliveryLogs.id,
      status: webhookDeliveryLogs.status,
      statusCode: webhookDeliveryLogs.statusCode,
      attempts: webhookDeliveryLogs.attempts,
      webhookUrl: webhookDeliveryLogs.webhookUrl,
      errorMessage: webhookDeliveryLogs.errorMessage,
      createdAt: webhookDeliveryLogs.createdAt,
      completedAt: webhookDeliveryLogs.completedAt,
    })
    .from(webhookDeliveryLogs)
    .where(eq(webhookDeliveryLogs.formId, formId))
    .orderBy(sql`${webhookDeliveryLogs.createdAt} desc`)
    .limit(limit);
}
