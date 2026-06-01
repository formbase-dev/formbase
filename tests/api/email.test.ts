import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendMail } from '../../packages/email/index';

const accountId = '8e642ff58d22bbbe4eda926dda88649e';
const apiToken = 'test-cloudflare-token';
const emailFrom = 'Formbase <noreply@mail.example.com>';

beforeEach(() => {
  vi.stubEnv('SMTP_TRANSPORT', 'cloudflare');
  vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', accountId);
  vi.stubEnv('CLOUDFLARE_API_TOKEN', apiToken);
  vi.stubEnv('EMAIL_FROM', emailFrom);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Cloudflare email transport', () => {
  it('sends email through the Cloudflare REST API', async () => {
    const apiResponse = {
      success: true,
      errors: [],
      result: {
        delivered: ['user@example.com'],
        permanent_bounces: [],
        queued: [],
      },
    };
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      Response.json(apiResponse, { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendMail({
        to: 'user@example.com',
        subject: 'Welcome',
        body: '<p>Hello</p>',
      }),
    ).resolves.toEqual(apiResponse);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error('Expected Cloudflare fetch call');

    const [url, init] = call;
    expect(url).toBe(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
    );
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      from: emailFrom,
      to: 'user@example.com',
      subject: 'Welcome',
      html: '<p>Hello</p>',
    });
  });

  it('throws the Cloudflare API error message', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      Response.json(
        {
          success: false,
          errors: [
            {
              code: 10001,
              message: 'email.sending.error.invalid_request_schema',
            },
          ],
          result: null,
        },
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendMail({
        to: 'user@example.com',
        subject: 'Welcome',
        body: '<p>Hello</p>',
      }),
    ).rejects.toThrow('email.sending.error.invalid_request_schema');
  });

  it('throws the Cloudflare API error message for non-ok responses', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      Response.json(
        {
          success: false,
          errors: [
            {
              code: 10001,
              message: 'email.sending.error.invalid_request_schema',
            },
          ],
          result: null,
        },
        { status: 400 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendMail({
        to: 'user@example.com',
        subject: 'Welcome',
        body: '<p>Hello</p>',
      }),
    ).rejects.toThrow('email.sending.error.invalid_request_schema');
  });
});
