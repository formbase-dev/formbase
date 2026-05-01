import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { apiKeys } from './api-keys';

export const apiAuditLogs = sqliteTable(
  'api_audit_logs',
  {
    id: text('id').primaryKey(),
    apiKeyId: text('api_key_id').references(() => apiKeys.id, {
      onDelete: 'set null',
    }),
    userId: text('user_id').notNull(),
    method: text('method').notNull(),
    path: text('path').notNull(),
    statusCode: integer('status_code').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    requestBody: text('request_body'),
    responseTimeMs: integer('response_time_ms'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (t) => [
    index('audit_api_key_idx').on(t.apiKeyId),
    index('audit_user_idx').on(t.userId),
    index('audit_created_at_idx').on(t.createdAt),
  ],
);

export const ZSelectApiAuditLogSchema = createSelectSchema(apiAuditLogs);
export const ZInsertApiAuditLogSchema = createInsertSchema(apiAuditLogs);

export type ApiAuditLog = typeof apiAuditLogs.$inferSelect;
export type NewApiAuditLog = typeof apiAuditLogs.$inferInsert;
