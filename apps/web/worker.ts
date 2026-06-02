// @ts-ignore generated at build time
import { default as handler } from './.open-next/worker.js';
// @ts-ignore generated at build time
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from './.open-next/worker.js';

function hydrateProcessEnv(env: Record<string, unknown>) {
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === 'string') process.env[k] = v;
  }
}

export default {
  fetch: handler.fetch,
  async queue(batch: unknown, env: Record<string, unknown>, ctx: unknown) {
    hydrateProcessEnv(env);
    const { handleWebhookBatch } = await import('./src/lib/webhooks/consumer');
    await handleWebhookBatch(batch as never, env, ctx);
  },
  async scheduled(
    controller: { cron: string },
    env: Record<string, unknown>,
    ctx: unknown,
  ) {
    hydrateProcessEnv(env);
    const { handleScheduled } = await import('./src/lib/webhooks/scheduled');
    await handleScheduled(controller, env as never, ctx);
  },
};
