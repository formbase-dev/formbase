import type { User } from '@formbase/db/schema';
import type { OpenApiMeta } from 'trpc-to-openapi';

import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

import { db } from '@formbase/db';

import { validateApiKey } from '../../middleware/api-auth';
import { checkRateLimit } from '../../middleware/rate-limit';

export interface ApiV1Context {
  db: typeof db;
  headers: Headers;
  apiKey?: {
    id: string;
    userId: string;
    user: User;
  };
  user?: User;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  retryAfterSeconds?: number;
}

export const createApiV1Context = (opts: {
  headers: Headers;
}): ApiV1Context => {
  return {
    db,
    headers: opts.headers,
  };
};

const t = initTRPC
  .context<ApiV1Context>()
  .meta<OpenApiMeta>()
  .create({
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

export const createApiV1Router = t.router;

export const createApiV1Caller = t.createCallerFactory;

export const publicApiProcedure = t.procedure;

export const apiKeyProcedure = t.procedure.use(async ({ ctx, next }) => {
  const authorization = ctx.headers.get('authorization');
  const apiKey = await validateApiKey(authorization, ctx.db);

  if (!apiKey) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing API key',
    });
  }

  const rateLimit = checkRateLimit(apiKey.id);

  if (!rateLimit.allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Retry after ${rateLimit.retryAfterSeconds} seconds.`,
    });
  }

  return next({
    ctx: {
      ...ctx,
      apiKey: {
        id: apiKey.id,
        userId: apiKey.userId,
        user: apiKey.user,
      },
      user: apiKey.user,
      rateLimitRemaining: rateLimit.remaining,
      rateLimitReset: rateLimit.resetAt.getTime(),
    },
  });
});
