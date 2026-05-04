import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

const booleanFromString = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return value;
}, z.boolean());

export const env = createEnv({
  shared: {
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  server: {
    PORT: z.coerce.number().default(3000),

    DATABASE_URL: z
      .string()
      .refine(
        (url) => url.startsWith('libsql://') || url.startsWith('file:'),
        'Must be libsql:// or file: URL',
      ),
    TURSO_AUTH_TOKEN: z.string().optional(),

    BETTER_AUTH_SECRET: z.string().trim().min(32),

    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),

    SMTP_HOST: z.string().trim().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).optional(),
    SMTP_USER: z.string().trim().min(1).optional(),
    SMTP_PASS: z.string().trim().min(1).optional(),

    ALLOW_SIGNIN_SIGNUP: z.string().trim().min(1),
    SKIP_EMAIL_VERIFICATION: booleanFromString.optional(),

    UMAMI_TRACKING_ID: z.string().optional(),
    STORAGE_ENDPOINT: z
      .string()
      .trim()
      .min(1)
      .refine(
        (endpoint) => !/^https?:\/\//i.test(endpoint),
        'Do not include protocol in STORAGE_ENDPOINT',
      )
      .optional(),
    STORAGE_PORT: z.coerce.number().int().min(1).optional(),
    STORAGE_USESSL: booleanFromString.optional(),
    STORAGE_FORCE_PATH_STYLE: booleanFromString.optional(),
    STORAGE_ACCESS_KEY: z.string().trim().min(1).optional(),
    STORAGE_SECRET_KEY: z.string().trim().min(1).optional(),
    STORAGE_BUCKET: z.string().trim().min(1).optional(),
    STORAGE_REGION: z.string().trim().min(1).optional(),

    RESEND_API_KEY: z.string().trim().optional(),
    SMTP_TRANSPORT: z.enum(['smtp', 'resend']).optional(),

    CRON_SECRET: z.string().trim().min(1).optional(),
    VERCEL_URL: z.string().optional(),
  },
  clientPrefix: 'NEXT_PUBLIC_',
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
});
