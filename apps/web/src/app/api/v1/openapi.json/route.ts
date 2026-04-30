import { generateOpenApiDocument } from 'trpc-to-openapi';

import { apiV1Router } from '@formbase/api/routers/api-v1';
import { env } from '@formbase/env';

export const dynamic = 'force-dynamic';

export function GET() {
  const openApiDocument = generateOpenApiDocument(apiV1Router, {
    title: 'Formbase API',
    version: '1.0.0',
    baseUrl: `${env.NEXT_PUBLIC_APP_URL}/api/v1`,
    description: 'Public REST API for managing forms and submissions.',
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API key in format: Bearer api_xxxxxxxxxxxxx',
      },
    },
  });

  return Response.json(openApiDocument);
}
