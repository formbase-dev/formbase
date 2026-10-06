import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const smtp = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('nodemailer', () => ({ createTransport: smtp.createTransport }));

const message = {
  to: 'recipient+notification@example.com',
  subject: 'New submission',
  body: '<p>A local test submission</p>',
};

const smtpEnvKeys = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_TRANSPORT',
] as const;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('SKIP_ENV_VALIDATION', '');
  vi.stubEnv('NODE_ENV', 'production');
  smtpEnvKeys.forEach((key) => vi.stubEnv(key, undefined));
  vi.stubEnv('SMTP_TRANSPORT', 'smtp');
  vi.stubEnv('SMTP_HOST', 'smtp.example.invalid');
  vi.stubEnv('SMTP_PORT', '465');
  vi.stubEnv('SMTP_USER', 'local-test-user');
  vi.stubEnv('SMTP_PASS', 'local-test-password');
  smtp.createTransport.mockReturnValue({ sendMail: smtp.sendMail });
  smtp.sendMail.mockResolvedValue({ messageId: 'local-test-message' });
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('SMTP email transport', () => {
  it('creates authenticated production SMTP transport and sends the message', async () => {
    const { sendMail } = await import('../../packages/email/index');

    await expect(sendMail(message)).resolves.toEqual({
      messageId: 'local-test-message',
    });

    expect(smtp.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.invalid',
      port: 465,
      secure: true,
      auth: { user: 'local-test-user', pass: 'local-test-password' },
    });
    expect(smtp.sendMail).toHaveBeenCalledWith({
      from: '"Formbase" <noreply@formbase.dev>',
      to: message.to,
      subject: message.subject,
      html: message.body,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reuses the SMTP transport for subsequent messages', async () => {
    const { sendMail } = await import('../../packages/email/index');

    await sendMail(message);
    await sendMail({ ...message, subject: 'Second submission' });

    expect(smtp.createTransport).toHaveBeenCalledTimes(1);
    expect(smtp.sendMail).toHaveBeenCalledTimes(2);
  });

  it('supports development SMTP without authentication', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SMTP_PORT', '587');
    vi.stubEnv('SMTP_USER', undefined);
    vi.stubEnv('SMTP_PASS', undefined);
    const { sendMail } = await import('../../packages/email/index');

    await sendMail(message);

    expect(smtp.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.invalid',
      port: 587,
      secure: false,
    });
  });

  it.each(['SMTP_HOST', 'SMTP_PORT'] as const)(
    'rejects a missing %s before creating a transport',
    async (key) => {
      vi.stubEnv(key, undefined);
      const { sendMail } = await import('../../packages/email/index');

      await expect(sendMail(message)).rejects.toThrow(
        'Missing SMTP_HOST or SMTP_PORT',
      );
      expect(smtp.createTransport).not.toHaveBeenCalled();
      expect(smtp.sendMail).not.toHaveBeenCalled();
    },
  );

  it.each(['SMTP_USER', 'SMTP_PASS'] as const)(
    'rejects partial credentials with missing %s',
    async (key) => {
      vi.stubEnv(key, undefined);
      const { sendMail } = await import('../../packages/email/index');

      await expect(sendMail(message)).rejects.toThrow(
        'SMTP_USER and SMTP_PASS must both be set',
      );
      expect(smtp.createTransport).not.toHaveBeenCalled();
    },
  );

  it('rejects unconfigured email transport outside test mode', async () => {
    smtpEnvKeys.forEach((key) => vi.stubEnv(key, undefined));
    const { sendMail } = await import('../../packages/email/index');

    await expect(sendMail(message)).rejects.toThrow(
      'Email transport not configured',
    );
    expect(smtp.createTransport).not.toHaveBeenCalled();
  });

  it.each([
    'First <first@example.com>',
    'first@example.com,second@example.com',
    'recipient@example.com\r\nBcc: another@example.com',
    `${'('.repeat(128)}recipient@example.com${')'.repeat(128)}`,
  ])('rejects invalid recipient %j before invoking Nodemailer', async (to) => {
    const { sendMail } = await import('../../packages/email/index');

    await expect(sendMail({ ...message, to })).rejects.toThrow();

    expect(smtp.createTransport).not.toHaveBeenCalled();
    expect(smtp.sendMail).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
