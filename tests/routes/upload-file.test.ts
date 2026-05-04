import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storageEnvKeys = [
  'STORAGE_ACCESS_KEY',
  'STORAGE_BUCKET',
  'STORAGE_ENDPOINT',
  'STORAGE_FORCE_PATH_STYLE',
  'STORAGE_PORT',
  'STORAGE_REGION',
  'STORAGE_SECRET_KEY',
  'STORAGE_USESSL',
] as const;

const originalStorageEnv = Object.fromEntries(
  storageEnvKeys.map((key) => [key, process.env[key]]),
) as Record<(typeof storageEnvKeys)[number], string | undefined>;

const setStorageEnv = (
  overrides: Partial<Record<(typeof storageEnvKeys)[number], string>> = {},
) => {
  process.env['STORAGE_ACCESS_KEY'] = 'EXAMPLEACCESSKEY';
  process.env['STORAGE_BUCKET'] = 'examplebucket';
  process.env['STORAGE_ENDPOINT'] = 's3.amazonaws.com';
  Reflect.deleteProperty(process.env, 'STORAGE_FORCE_PATH_STYLE');
  process.env['STORAGE_PORT'] = '443';
  process.env['STORAGE_REGION'] = 'us-east-1';
  process.env['STORAGE_SECRET_KEY'] =
    'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
  process.env['STORAGE_USESSL'] = 'true';

  Object.entries(overrides).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

describe('upload-file storage signing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2013-05-24T00:00:00.000Z'));
    setStorageEnv();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();

    storageEnvKeys.forEach((key) => {
      const value = originalStorageEnv[key];

      if (value === undefined) {
        Reflect.deleteProperty(process.env, key);
      } else {
        process.env[key] = value;
      }
    });
  });

  it('creates a deterministic virtual-hosted S3 presigned GET URL', async () => {
    const { createFileDownloadUrl } = await import('~/lib/upload-file');

    await expect(createFileDownloadUrl('test.txt', 86400)).resolves.toBe(
      'https://examplebucket.s3.amazonaws.com/test.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=EXAMPLEACCESSKEY%2F20130524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=2d9f6ea87a66cbc053ded52cfd4a8bfb879f862269704a8ae24d81d0f5ad5808',
    );
  });

  it('uses path-style storage URLs when configured', async () => {
    setStorageEnv({ STORAGE_ENDPOINT: 'localhost' });
    const { createFileDownloadUrl } = await import('~/lib/upload-file');

    const url = await createFileDownloadUrl('test.txt', 300);

    expect(new URL(url).origin).toBe('https://localhost');
    expect(new URL(url).pathname).toBe('/examplebucket/test.txt');
  });

  it('signs the content type header sent with PUT uploads', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    const { uploadFile } = await import('~/lib/upload-file');
    const fileUrl = await uploadFile(new Blob(['<svg />']), 'image/svg+xml');

    expect(fileUrl).toMatch(
      /^http:\/\/localhost:3000\/api\/files\/[0-9A-Za-z]{15}\.svg$/,
    );

    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];

    expect(new URL(url).searchParams.get('X-Amz-SignedHeaders')).toBe(
      'content-type;host',
    );
    expect(init.headers).toEqual({ 'Content-Type': 'image/svg+xml' });
  });
});
