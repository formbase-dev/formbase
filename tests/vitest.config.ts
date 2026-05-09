import path from 'path';

import { defineConfig } from 'vitest/config';

process.env['SKIP_ENV_VALIDATION'] = 'true';
process.env.NODE_ENV = 'test';
process.env['DATABASE_URL'] = 'file::memory:?cache=shared';
process.env['BETTER_AUTH_SECRET'] = 'test-secret-minimum-32-characters-long-for-testing';
process.env['ALLOW_SIGNIN_SIGNUP'] = 'true';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Serial execution for SQLite
      },
    },
    server: {
      deps: {
        inline: ['zod', '@t3-oss/env-core'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        '../packages/api/**/*.ts',
        '../apps/web/src/app/api/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@formbase/api': path.resolve(__dirname, '../packages/api'),
      '@formbase/db': path.resolve(__dirname, '../packages/db'),
      '@formbase/auth': path.resolve(__dirname, '../packages/auth'),
      '@formbase/env': path.resolve(__dirname, '../packages/env'),
      '@formbase/utils': path.resolve(__dirname, '../packages/utils'),
      '~': path.resolve(__dirname, '../apps/web/src'),
    },
  },
});
