import { cleanupOldAuditLogs } from '@formbase/api/lib/audit-log';
import { db } from '@formbase/db';
import { env } from '@formbase/env';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await cleanupOldAuditLogs(db);
    return Response.json({ success: true, message: 'Audit logs cleaned up' });
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    return Response.json(
      { error: 'Failed to cleanup audit logs' },
      { status: 500 },
    );
  }
}
