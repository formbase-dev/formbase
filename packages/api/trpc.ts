import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { getSession } from '@formbase/auth/server';
import { db } from '@formbase/db';

import type { WebhookQueue } from './lib/webhook';

export const createTRPCContext = async (opts: {
  headers: Headers;
  webhookQueue?: WebhookQueue;
}) => {
  const session = await getSession();
  const user = session?.user ?? null;

  return {
    db,
    session,
    user,
    webhookQueue: opts.webhookQueue,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});
export const createCallerFactory = t.createCallerFactory;

export const createRouter = t.router;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      session: { ...ctx.session },
      user: { ...ctx.user },
    },
  });
});
