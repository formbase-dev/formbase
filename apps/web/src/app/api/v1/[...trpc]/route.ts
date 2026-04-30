import { after, NextResponse } from 'next/server';

import type { ApiV1Context } from '@formbase/api/routers/api-v1';
import type { NextRequest } from 'next/server';

import { createOpenApiFetchHandler } from 'trpc-to-openapi';

import { logApiRequest } from '@formbase/api';
import { apiV1Router, createApiV1Context } from '@formbase/api/routers/api-v1';
import { db } from '@formbase/db';

export const dynamic = 'force-dynamic';

type OpenApiErrorBody = {
  code?: unknown;
  message?: unknown;
};

async function transformErrorResponse(response: Response): Promise<Response> {
  if (response.ok) return response;

  try {
    const body = (await response.json()) as OpenApiErrorBody;
    const code =
      typeof body.code === 'string' ? body.code : 'INTERNAL_SERVER_ERROR';
    const message =
      typeof body.message === 'string'
        ? body.message
        : 'An unexpected error occurred';
    const errorResponse = {
      error: {
        code,
        message,
      },
    };

    const headers = new Headers(response.headers);

    if (response.status === 429) {
      const match = /Retry after (\d+) seconds/.exec(message);
      const retryAfterSeconds = match?.[1];

      if (retryAfterSeconds) {
        headers.set('Retry-After', retryAfterSeconds);
      }
    }

    return new NextResponse(JSON.stringify(errorResponse), {
      status: response.status,
      headers,
    });
  } catch {
    return response;
  }
}

const handler = async (req: NextRequest) => {
  const startTime = Date.now();
  let ctx: ApiV1Context | null = null;

  const response = await createOpenApiFetchHandler({
    endpoint: '/api/v1',
    router: apiV1Router,
    createContext: () => {
      ctx = createApiV1Context({
        headers: req.headers,
        afterResponse: after,
      });
      return ctx;
    },
    req,
    responseMeta: ({ ctx: responseCtx }) => {
      const headers: Record<string, string> = {};
      const typedCtx = responseCtx;

      if (typedCtx?.rateLimitRemaining !== undefined) {
        headers['X-RateLimit-Remaining'] = String(typedCtx.rateLimitRemaining);
      }
      if (typedCtx?.rateLimitReset !== undefined) {
        headers['X-RateLimit-Reset'] = String(typedCtx.rateLimitReset);
      }

      return { headers };
    },
  });

  const responseTime = Date.now() - startTime;
  const typedCtx = ctx as ApiV1Context | null;
  const apiKey = typedCtx?.apiKey;

  if (apiKey) {
    const ipAddress =
      req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');

    after(async () => {
      await logApiRequest(db, {
        apiKeyId: apiKey.id,
        userId: apiKey.userId,
        method: req.method,
        path: new URL(req.url).pathname,
        statusCode: response.status,
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {}),
        responseTimeMs: responseTime,
      }).catch(() => undefined);
    });
  }

  return transformErrorResponse(response);
};

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
