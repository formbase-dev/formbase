import type { db as database } from '@formbase/db';

import { drizzlePrimitives } from '@formbase/db';
import { apiAuditLogs } from '@formbase/db/schema';
import { generateId } from '@formbase/utils/generate-id';

type Database = typeof database;

interface AuditLogParams {
  apiKeyId: string | null;
  userId: string;
  method: string;
  path: string;
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: unknown;
  responseTimeMs?: number;
}

export async function logApiRequest(db: Database, params: AuditLogParams) {
  await db.insert(apiAuditLogs).values({
    id: generateId(15),
    apiKeyId: params.apiKeyId,
    userId: params.userId,
    method: params.method,
    path: params.path,
    statusCode: params.statusCode,
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
    requestBody: sanitizeRequestBody(params.requestBody),
    responseTimeMs: params.responseTimeMs ?? null,
  });
}

function sanitizeRequestBody(body: unknown): string | null {
  if (!body) return null;
  if (typeof body !== 'object') return JSON.stringify(body);

  const sanitized = { ...(body as Record<string, unknown>) };
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'authorization',
  ];

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return JSON.stringify(sanitized);
}

export async function cleanupOldAuditLogs(db: Database) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await db
    .delete(apiAuditLogs)
    .where(drizzlePrimitives.lt(apiAuditLogs.createdAt, ninetyDaysAgo));
}
