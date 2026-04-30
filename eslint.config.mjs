// @ts-nocheck
import base from './packages/config/eslint/base.js';
import next from './packages/config/eslint/next.js';
import react from './packages/config/eslint/react.js';

const webFiles = ['apps/web/**/*.{js,jsx,mjs,ts,tsx,mts,cts}'];
const uiFiles = ['packages/ui/**/*.{js,jsx,mjs,ts,tsx,mts,cts}'];
const reactFiles = [...webFiles, ...uiFiles];

const scopeConfigs = (configs, files, ignorePrefix) =>
  configs.map((config) => {
    if (config.ignores && !config.files) {
      return {
        ...config,
        ignores: config.ignores.map((pattern) => `${ignorePrefix}/${pattern}`),
      };
    }

    return {
      ...config,
      files,
    };
  });

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/test-results/**',
      '**/playwright-report/**',
      'apps/web/next-env.d.ts',
      'packages/core/.tsup/**',
    ],
  },
  ...base,
  ...scopeConfigs(next, webFiles, 'apps/web'),
  ...scopeConfigs(react, reactFiles, 'packages/ui'),
  {
    files: ['tests/**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
    },
  },
];
