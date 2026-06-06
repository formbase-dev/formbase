import type { WebhookQueue } from '@formbase/api/lib/webhook';

declare global {
  interface CloudflareEnv {
    WEBHOOK_QUEUE: WebhookQueue;
  }
}

export {};
