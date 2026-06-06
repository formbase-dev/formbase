import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { formDatas } from './form-data';
import { forms } from './forms';

export const webhookDeliveryLogs = sqliteTable(
  'webhook_delivery_logs',
  {
    id: text('id').primaryKey(),
    formId: text('form_id')
      .references(() => forms.id, { onDelete: 'cascade' })
      .notNull(),
    formDataId: text('form_data_id').references(() => formDatas.id, {
      onDelete: 'set null',
    }),
    webhookUrl: text('webhook_url').notNull(),
    payload: text('payload').notNull(),
    status: text('status', { enum: ['pending', 'success', 'failed'] })
      .default('pending')
      .notNull(),
    statusCode: integer('status_code'),
    responseBody: text('response_body'),
    errorMessage: text('error_message'),
    attempts: integer('attempts').default(0).notNull(),
    nextRetryAt: integer('next_retry_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    index('webhook_log_form_idx').on(t.formId),
    index('webhook_log_status_idx').on(t.status),
    index('webhook_log_next_retry_idx').on(t.nextRetryAt),
  ],
);

export type WebhookDeliveryLog = typeof webhookDeliveryLogs.$inferSelect;
